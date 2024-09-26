const express = require('express');
const path = require('path');
const fs = require('fs').promises;


const app = express();


const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'heroes.json');
const serverPublic = path.join(__dirname, 'public');

app.use(express.static(clientPath));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const users = JSON.parse(data);
        if (!users) {
            throw new Error("Error: no users available");
        }
        res.status(200).json(users);
    } catch (error) {
        console.error("Problem getting users" + error.message);
        res.status(500).json({ error: "Problem reading users" });
    }
});

app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

app.post('/submit-form', async (req, res) => {
    try {
        const { name, universe, powers } = req.body;

        let users = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            console.error('Error reading user data:', error);
            users = [];
        }

        let user = users.find(u => u.name === name && u.universe === universe);
        if (user) {
            user.powers.push(powers);
        } else {
            user = { name, universe, powers: [powers] };
            users.push(user);
        }

        await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

app.put('/update-user/:currentName/:currentUniverse', async (req, res) => {
    try {
        const { currentName, currentUniverse } = req.params;
        const { newName, newUniverse } = req.body;
        console.log('Current user:', { currentName, currentUniverse });
        console.log('New user data:', { newName, newUniverse });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(user => user.name === currentName && user.universe === currentUniverse);
            console.log(userIndex);
            if (userIndex === -1) {
                return res.status(404).json({ power: "User not found" });
            }
            users[userIndex] = { ...users[userIndex], name: newName, universe: newUniverse };
            console.log(users);
            await fs.writeFile(dataPath, JSON.stringify(users, null, 2));

            res.status(200).json({ message: `You sent ${newName} and ${newUniverse}` });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('An error occurred while updating the user.');
    };
});

app.delete('/user/:name/:universe', async (req, res) => {
    try {
        const { name, universe } = req.params;
        let users = [];

        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            return res.status(404).send('File data not found.');
        };
        const userIndex = users.findIndex(user => user.name === name && user.universe === universe);
        if (userIndex === -1) {
            return res.status(404).send('User not found.')
        } else {
            users.splice(userIndex, 1);
        };

        console.log(userIndex);
        console.log(users);

        try {
            await fs.writeFile(dataPath, JSON.stringify(users, null, 2))
        } catch (error) {
            console.error('Failed to reach database.')
        }
        res.send('Successfully deleted hero! ...you monster.')
    } catch (error) {
        res.status(500).send('There was a problem.')
    };
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});