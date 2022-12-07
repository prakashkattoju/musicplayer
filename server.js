const Pool = require('pg').Pool
const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "root",
    database: "projectfour"
})

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const jwt = require("jsonwebtoken");
const verifyaccesstoken = require("./verifyaccesstoken");
const Users = require("./users.json");

function slugify(text) {
    return text.toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'album_cover') {
            cb(null, `${__dirname}/client/public/uploads/album/`);
        } else if (file.fieldname === 'list_cover') {
            cb(null, `${__dirname}/client/public/uploads/list/`);
        } else if (file.fieldname === 'song_cover') {
            cb(null, `${__dirname}/client/public/uploads/songs/cover/`);
        } else if (file.fieldname === 'song_file') {
            cb(null, `${__dirname}/client/public/uploads/songs/file/`);
        } else {
            cb(null, `${__dirname}/client/public/uploads/`);
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${slugify(path.parse(file.originalname).name)}.${path.parse(file.originalname).ext}`);
    }
});
const upload = multer({ storage });

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/album/create', upload.single('album_cover'), function (req, res) {
    try {
        const album_cover = req.file.filename;
        const album_name = req.body['album_name'];
        const album_desc = req.body['album_desc'];
        const album_slug = slugify(album_name);

        pool.query('INSERT INTO albums (album_cover,album_name,album_desc,album_slug) VALUES ($1,$2,$3,$4) RETURNING *', [album_cover, album_name, album_desc, album_slug], (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json({ msg: `"${results.rows[0].album_name}" Album added` });
        })
    } catch (err) {
        res.status(500).send(err);
    }
});


app.get('/album/get', function (req, res) {
    pool.query(`SELECT * FROM albums ORDER BY album_id DESC`, (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
});

app.get('/album/:id', function (req, res) {
    const id = parseInt(req.params.id)
    pool.query('SELECT * FROM albums WHERE album_id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
})

const songUpload = upload.fields([
    { name: 'song_cover', maxCount: 1 },
    { name: 'song_file', maxCount: 1 }
])

app.post('/song/create', songUpload, function (req, res) {
    try {
        const album_id = req.body['album_id'];
        const song_cover = req.files['song_cover'] !== undefined ? req.files['song_cover'][0].filename : null;
        const song_name = req.body['song_name'];
        const song_meta = req.body['song_meta'];
        const song_file = req.files['song_file'][0].filename;

        pool.query('INSERT INTO song (album_id,song_cover,song_name,song_meta,song_file) VALUES ($1,$2,$3,$4,$5) RETURNING *', [album_id, song_cover, song_name, song_meta, song_file], (error, results) => {
            if (error) {
                throw error
            }
            res.status(201).send(`Song added with ID: ${results.rows[0].song_id}`)
        })
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/tracks/:id', function (req, res) {
    try {
        const id = parseInt(req.params.id)
        pool.query('SELECT * FROM song WHERE album_id = $1 ORDER BY song_id DESC', [id], (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json(results.rows)
        })
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/tracks', function (req, res) {
    try {
        pool.query('SELECT song.*, albums.album_cover, albums.album_name FROM song JOIN albums ON song.album_id = albums.album_id ORDER BY song_id DESC', (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json(results.rows)
        })
    } catch (err) {
        res.status(500).send(err);
    }
})

///////////////////////////////////////////////////////////////////////////////////////

app.post('/list/create', upload.single('list_cover'), function (req, res) {

    try {
        const list_cover = req.file ? req.file.filename : null;
        const list_name = req.body['list_name'];
        const list_desc = req.body['list_desc'];
        const user_id = req.body['user_id'];

        pool.query('INSERT INTO list (list_name, list_desc, user_id, list_cover) VALUES ($1,$2,$3,$4) RETURNING *', [list_name, list_desc, user_id, list_cover], (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json({ list_id: results.rows[0].list_id });
        })
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/lists/:id', function (req, res) {
    try {
        const id = parseInt(req.params.id)
        pool.query('SELECT * FROM list WHERE user_id = $1 ORDER BY list_id ASC', [id], (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json(results.rows)
        })
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/list/:id', function (req, res) {
    try {
        const id = parseInt(req.params.id)
        pool.query('SELECT * FROM list WHERE list_id = $1', [id], (error, results) => {
            if (error) {
                throw error
            }
            res.status(200).json(results.rows)
        })
    } catch (err) {
        res.status(500).send(err);
    }
})

/////////////////////////////////////////////////////////////////////////////////////


app.post('/register', function (req, res) {
    try {
        const index = Users.findIndex(x => x.uname === req.body.uname);
        if (index >= 0) return res.status(400).json({ error: "uname", msg: "User already exist" });

        var data = fs.readFileSync('./users.json');
        var myObject = JSON.parse(data);

        let element = {
            id: parseInt(myObject.length) + 1,
            name: req.body.name,
            uname: req.body.uname,
            password: req.body.password,
            role: 'user'
        }

        myObject.push(element);

        var newData = JSON.stringify(myObject);

        fs.writeFile('./users.json', newData, err => {
            // error checking
            if (err) throw err;
            res.status(200).json({ status: true, msg: "New user Registered" });
        });

    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/login', function (req, res) {
    try {
        const index = Users.findIndex(x => x.uname === req.body.uname);

        if (index < 0) return res.status(404).json({ msg: "User not found" });

        if (req.body.password !== Users[index].password) return res.status(400).json({ msg: "Wrong Password" });

        let payload = {
            user: {
                id: Users[index].id
            }
        }
        const accessToken = jwt.sign(payload, 'Project4', { expiresIn: '1d' });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ accessToken });

    } catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/logout', function (req, res) {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.sendStatus(204);
    res.clearCookie('accessToken');
    return res.sendStatus(200);
});

app.get('/user', verifyaccesstoken, function (req, res) {
    try {
        const index = Users.findIndex(x => x.id === req.user.id);
        if (index < 0) return res.status(400).json({ msg: "User not found..." });

        res.json(Users[index]);

    } catch (error) {
        console.log(error);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////
app.listen(5000, () => {
    console.log("Sever is now listening at port 5000");
})