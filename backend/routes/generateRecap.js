import express from 'express';
import fetchEpisodeSummary from '../utils/fetchEpisodeSummary.js';

const router = express.Router()

router.post('/', async (req, res)=> {
    try {
        const { show, episode_no, season_no } = req.body;
        if (!show || !episode_no) {
            return res.status(400).json({error: 'show and episode_no are required' });
        }

        const summary = await fetchEpisodeSummary(show, Number(episode_no), Number(season_no || 1)); 
        res.json({ summary })
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Failed to generate recap' });
        }
});

export default router;