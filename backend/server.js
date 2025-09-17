import express from 'express';
import cors from 'cors';
import generateRecapRouter from './routes/generateRecap.js'

const app = express();
app.use(cors())
app.use(express.json())


app.use('/generate-recap', generateRecapRouter)

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=> {
    console.log(`Backend running on port ${PORT}`)
});