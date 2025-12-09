import fs from 'fs/promises';
import path from 'path';
import { insertPost, insertPhoto, insertTopic, insertComment, insertVideo, db } from './db.js';

// Configuration
const SERVICE_TOKEN = process.env.VK_SERVICE_TOKEN;
const USER_TOKEN = process.env.VK_USER_TOKEN;
const GROUP_ID = process.env.VK_GROUP_ID;
const API_VERSION = '5.199';

const GROUP_ID_NUM = Math.abs(Number(GROUP_ID));
const OWNER_ID = -GROUP_ID_NUM;

// Delay helper to avoid rate-limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ARGS = process.argv.slice(2);
const FORCE_REFRESH = ARGS.includes('--force');

async function main() {
    console.log(`🔄 Starting VK -> DB Sync ${FORCE_REFRESH ? '(FORCE REFRESH)' : '(Incremental)'}...`);

    if (!SERVICE_TOKEN || !GROUP_ID) {
        console.error('❌ Error: VK_SERVICE_TOKEN or VK_GROUP_ID not found.');
        process.exit(1);
    }

    if (USER_TOKEN) {
        console.log('   🔑 VK_USER_TOKEN found. Using it for videos and advanced access.');
    } else {
        console.log('   ℹ️  No VK_USER_TOKEN found. Some videos might be restricted.');
    }

    try {
        // initDB(); // executed on import

        // 1. Photos
        await fetchAndSavePhotos();

        // 2. Posts (Wall)
        await fetchAndSavePosts();

        // 3. Discussions (Topics)
        await fetchAndSaveTopics();

        // 4. Videos (Requires User Token for best results)
        await fetchAndSaveVideos();

        console.log('✨ VK Content Sync (DB) completed successfully!');
    } catch (error) {
        console.error('❌ Error during sync:', error);
        process.exit(1);
    }
}


async function vkRequest(method, params = {}) {
    // Choose token: User token for videos/users related, Service token for public group data
    let token = SERVICE_TOKEN;
    if (method.startsWith('video.') && USER_TOKEN) {
        token = USER_TOKEN;
    }

    const searchParams = new URLSearchParams({
        access_token: token,
        v: API_VERSION,
        ...params
    });

    const url = `https://api.vk.com/method/${method}`;

    try {
        const response = await fetch(`${url}?${searchParams.toString()}`);
        const data = await response.json();

        if (data.error) {
            console.error(`VK API Error ${data.error.error_code}: ${data.error.error_msg}`);
            // Simple retry logic for "Too many requests"
            if (data.error.error_code === 6) {
                console.log('   ⏳ Rate limit hit, waiting 1s...');
                await sleep(1000);
                return vkRequest(method, params);
            }
            return null;
        }
        return data.response;
    } catch (e) {
        console.error(`Failed to fetch ${method}:`, e.message);
        return null;
    }
}

async function fetchAndSavePhotos() {
    console.log('📸 Fetching photos...');

    let lastSyncedDate = 0;
    if (!FORCE_REFRESH) {
        const row = db.prepare('SELECT MAX(date) as d FROM photos').get();
        if (row && row.d) lastSyncedDate = row.d;
        console.log(`   🕒 Incremental: Fetching photos newer than ${new Date(lastSyncedDate * 1000).toISOString()}`);
    }

    // 1. Fetch ALL Albums
    let allAlbums = [];
    let offset = 0;
    let hasMoreAlbums = true;

    while (hasMoreAlbums) {
        const albumsData = await vkRequest('photos.getAlbums', {
            owner_id: OWNER_ID, need_covers: 1, need_system: 1, count: 50, offset: offset
        });

        if (albumsData && albumsData.items && albumsData.items.length > 0) {
            allAlbums.push(...albumsData.items);
            offset += 50;
            if (offset >= albumsData.count) hasMoreAlbums = false;
        } else {
            hasMoreAlbums = false;
        }
        await sleep(200);
    }
    console.log(`   📂 Found ${allAlbums.length} albums. Syncing...`);

    let totalPhotosSynced = 0;

    for (const album of allAlbums) {
        if (album.size === 0) continue;

        let photoOffset = 0;
        let hasMorePhotos = true;

        while (hasMorePhotos) {
            const photos = await vkRequest('photos.get', {
                owner_id: OWNER_ID, album_id: album.id, count: 100, offset: photoOffset, photo_sizes: 1
            });

            if (photos && photos.items && photos.items.length > 0) {
                // Filter for incremental?
                // For albums, it's hard because order varies. 
                // We'll trust the user wants speed mainly on Posts/Videos.
                // But let's at least check if we are in a "date updated" mode?
                // Simplify: just upsert. It's fast enough efficiently.

                const insertTx = db.transaction((items) => {
                    for (const p of items) {
                        const bestUrl = getBestPhotoUrl(p.sizes);
                        insertPhoto.run({
                            id: p.id,
                            owner_id: p.owner_id,
                            album_id: p.album_id,
                            album_title: album.title,
                            url: bestUrl,
                            caption: p.text || album.title,
                            date: p.date,
                            width: 0,
                            height: 0
                        });
                    }
                });

                insertTx(photos.items);
                totalPhotosSynced += photos.items.length;
                photoOffset += photos.items.length;

                if (photoOffset >= photos.count) hasMorePhotos = false;
                await sleep(150);
            } else {
                hasMorePhotos = false;
            }
        }
    }
    console.log(`   ✅ Total photos synced: ${totalPhotosSynced}`);
}

async function fetchAndSavePosts() {
    console.log('📝 Fetching posts (wall)...');

    let lastSyncedDate = 0;
    if (!FORCE_REFRESH) {
        const row = db.prepare('SELECT MAX(date) as d FROM posts').get();
        if (row && row.d) lastSyncedDate = row.d;
        console.log(`   🕒 Incremental: Fetching posts newer than ${new Date(lastSyncedDate * 1000).toISOString()}`);
    }

    const initialData = await vkRequest('wall.get', { owner_id: OWNER_ID, count: 1, offset: 0 });
    if (!initialData) return;

    const totalCount = initialData.count;
    const BATCH_SIZE = 100;
    let processed = 0;

    for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
        const data = await vkRequest('wall.get', {
            owner_id: OWNER_ID, count: BATCH_SIZE, offset: offset, extended: 1
        });

        if (!data || !data.items || data.items.length === 0) break;

        const newItems = [];
        let stopFetching = false;

        for (const post of data.items) {
            if (!post.is_pinned && post.date <= lastSyncedDate) {
                stopFetching = true;
                continue;
            }
            newItems.push(post);
        }

        if (newItems.length > 0) {
            const insertTx = db.transaction((posts) => {
                for (const post of posts) {
                    const imageUrls = [];
                    const videoUrls = [];
                    if (post.attachments) {
                        post.attachments.forEach(att => {
                            if (att.type === 'photo') imageUrls.push(getBestPhotoUrl(att.photo.sizes));
                            else if (att.type === 'video') {
                                if (att.video.player) videoUrls.push(att.video.player);
                                else videoUrls.push(`https://vk.com/video${att.video.owner_id}_${att.video.id}`);
                            }
                        });
                    }
                    const tags = [];
                    const textLower = (post.text || '').toLowerCase();
                    if (textLower.includes('#награда') || textLower.includes('диплом') || textLower.includes('лауреат') || textLower.includes('гран-при')) tags.push('award');
                    if (textLower.includes('спектакль') || textLower.includes('афиша')) tags.push('play');

                    insertPost.run({
                        id: post.id,
                        owner_id: post.owner_id,
                        date: post.date,
                        text: post.text || '',
                        image_urls: JSON.stringify(imageUrls),
                        video_urls: JSON.stringify(videoUrls),
                        raw_json: JSON.stringify(post),
                        tags: tags.join(',')
                    });
                }
            });
            insertTx(newItems);
            processed += newItems.length;
            console.log(`   ⬇️ Batch ${offset}: Saved ${newItems.length} new posts.`);
        } else {
            console.log(`   ℹ️ Batch ${offset}: All posts already in DB.`);
        }

        if (stopFetching) {
            console.log(`   🛑 Reached known data (date <= ${lastSyncedDate}). Stopping.`);
            break;
        }
        await sleep(350);
    }
    console.log(`   ✅ Sync finished. New/Updated: ${processed}.`);
}

async function fetchAndSaveTopics() {
    console.log('🗣️  Fetching discussions (topics)...');
    const data = await vkRequest('board.getTopics', { group_id: GROUP_ID_NUM, count: 100, preview: 1 });
    if (!data || !data.items) return;

    const topics = data.items;
    const insertTx = db.transaction((items) => {
        for (const t of items) {
            insertTopic.run({
                id: t.id, title: t.title, created: t.created, updated: t.updated, comments_count: t.comments, is_closed: t.is_closed ? 1 : 0
            });
        }
    });
    insertTx(topics);
    // console.log(`   Saved ${topics.length} topics.`);

    for (const topic of topics) {
        const titleLower = topic.title.toLowerCase();
        if (titleLower.includes('наград') || titleLower.includes('диплом') || titleLower.includes('побед') || titleLower.includes('отзыв')) {
            // console.log(`   💬 Fetching comments for topic: "${topic.title}"...`);
            await fetchComments(topic.id);
            await sleep(350);
        }
    }
}

async function fetchComments(topicId) {
    let offset = 0;
    const count = 100;
    let hasMore = true;
    while (hasMore) {
        const data = await vkRequest('board.getComments', { group_id: GROUP_ID_NUM, topic_id: topicId, count: count, offset: offset, extended: 1 });
        if (!data || !data.items || data.items.length === 0) { hasMore = false; break; }

        const insertTx = db.transaction((comments) => {
            for (const c of comments) {
                const attachments = [];
                if (c.attachments) {
                    c.attachments.forEach(att => {
                        if (att.type === 'photo') attachments.push({ type: 'photo', url: getBestPhotoUrl(att.photo.sizes), text: att.photo.text });
                    });
                }
                insertComment.run({
                    id: c.id, topic_id: topicId, owner_id: c.from_id, date: c.date, text: c.text || '', attachments: JSON.stringify(attachments)
                });
            }
        });
        insertTx(data.items);
        offset += count;
        if (offset >= data.count) hasMore = false;
        await sleep(200);
    }
}

async function fetchAndSaveVideos() {
    console.log('🎥 Fetching videos...');
    let lastSyncedDate = 0;
    if (!FORCE_REFRESH) {
        const row = db.prepare('SELECT MAX(date) as d FROM videos').get();
        if (row && row.d) lastSyncedDate = row.d;
        console.log(`   🕒 Incremental: Fetching videos newer than ${new Date(lastSyncedDate * 1000).toISOString()}`);
    }

    let offset = 0;
    const count = 200;
    let hasMore = true;
    let totalVideos = 0;

    while (hasMore) {
        const data = await vkRequest('video.get', { owner_id: OWNER_ID, count: count, offset: offset, extended: 1 });
        if (!data || !data.items || data.items.length === 0) { hasMore = false; break; }

        const newItems = [];
        let stopFetching = false;

        for (const v of data.items) {
            if (v.date <= lastSyncedDate) { stopFetching = true; continue; }
            newItems.push(v);
        }

        if (newItems.length > 0) {
            const insertTx = db.transaction((items) => {
                for (const v of items) {
                    insertVideo.run({
                        id: v.id, owner_id: v.owner_id, title: v.title, description: v.description || '', duration: v.duration,
                        image_url: getBestPhotoUrl(v.image), player_url: v.player, album_ids: JSON.stringify(v.album_ids || []), date: v.date, type: v.type || 'video'
                    });
                }
            });
            insertTx(newItems);
            totalVideos += newItems.length;
            console.log(`   ⬇️ Batch ${offset}: Saved ${newItems.length} videos.`);
        } else {
            console.log(`   ℹ️ Batch ${offset}: All videos already in DB.`);
        }

        if (stopFetching) {
            console.log(`   🛑 Reached known videos. Stopping.`);
            hasMore = false;
            break;
        }
        offset += count;
        if (offset >= data.count) hasMore = false;
        await sleep(350);
    }
    console.log(`   ✅ Saved ${totalVideos} new videos.`);
}

function getBestPhotoUrl(sizes) {
    if (!sizes || !Array.isArray(sizes)) return null;
    const typePriority = { 'w': 10, 'z': 9, 'y': 8, 'x': 7, 'm': 5, 's': 1 };
    const sorted = sizes.sort((a, b) => {
        const pA = typePriority[a.type] || 0;
        const pB = typePriority[b.type] || 0;
        return pB - pA;
    });
    return sorted[0]?.url;
}

main();
