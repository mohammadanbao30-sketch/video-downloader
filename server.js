const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تحميل وتثبيت yt-dlp تلقائياً على السيرفر السحابي عند الإقلاع
async function initializeYtDlp() {
    try {
        await YTDlpWrap.downloadFromGithub();
        console.log("تم تجهيز أداة التحميل بنجاح!");
    } catch (e) {
        console.error("خطأ في تحميل أداة yt-dlp:", e);
    }
}
initializeYtDlp();

const ytDlpWrap = new YTDlpWrap();

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        let metadata = await ytDlpWrap.execPromise([
            '--dump-json',
            url
        ]);

        const info = JSON.parse(metadata);
        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration_string || 'مباشر',
            formats: (info.formats || []).map(f => ({
                format_id: f.format_id,
                ext: f.ext,
                resolution: f.resolution || f.format_note,
                url: f.url
            })).filter(f => f.url && f.ext === 'mp4')
        });
    } catch (error) {
        res.status(500).json({ error: 'فشل في جلب الفيديو، تأكد من صحة الرابط أو جرب رابطاً آخر.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
