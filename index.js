// Aiden C. Desjarlais (C) 2023
//     LICENSED UNDER MIT

/* 
This app was made for contribution! Feel free to post a pull request with added features!
You'll find information for developing in comments below, happy programming!
*/

//Developer Vars
const OPEN_PAGE = true; //will open your default browser if true.
const LOAD_SAVE = true; //keep off to manually set the channel each time on load
const TESTING = false; //will enable 4 test donations of diffrent types.

const fs = require('fs');
const { LiveChat } = require("youtube-chat");

// our lord and saviour print()
const print = console.log;
// yes. This print method is necessary for convenience. ;)

const bodyParser = require('body-parser');
const app = require('express')();
var expressWs = require('express-ws')(app);
const path = require('path');
const { randomUUID } = require('crypto');
const chalk = require('chalk');
app.use(bodyParser.urlencoded({ extended: true }));

var loaded = false; // true if save is loaded
var saving = false; // true if saving
var paused = false; // true if time increases paused
var addSubAmount = 0; // in minutes
var addSuperChatAmount = 0; // in minutes
var setMinutesTestAmount = 1; // in minutes

/* 
These are increase types, they are empty classes used to increase the timer.
You can create your own, however make sure you provide logic for it within
StartCountdown() and initServer() !
Push the type to the countdownAdditionsQueue to add it to the queue.
*/
class Membership { }
class SuperChat { }
class Chat { } // push this for testing, with each chat time increases by the testing amount.

print(chalk.blueBright("Starting " + chalk.greenBright('MEMBERTHON') + " By Aiden C. Desjarlais " + chalk.blue("https://aidendes.com")));

//get overlay status
app.ws('/ws/status', function (ws, req) {
    ws.on('message', function (msg) {
        switch (msg) {
            case "statusRequest":
                if (failedStart)
                    ws.send(JSON.stringify({ details: failiureDetails, error: true }));
                else {
                    //add a new object to this json object to receive it on the status page.
                    ws.send(JSON.stringify({ error: false, online: true, member: addSubAmount, superchat: addSuperChatAmount, end: countDownDate.toString(), enddate: countDownDate.toISOString(), isSaving: saving, isPaused: paused, liveID: LiveID }));
                }
                break;
        }
    });
});

app.ws('/ws/timer', function (ws, req) {
    setInterval(() => {
        ws.send(countDownString)
    }, 250)
});


/* 
this is the base class for any alert. Its used to send information to the front end.
Feel free to create your own. To send it to the front end alert page, push it to the
AlertQueue array, and deal with the logic front end. (see alert.html for template logic)
*/
class Alert {
    type = undefined;
    username = undefined;
    donation = undefined;
    add = undefined;
    alertID = undefined;
    constructor(t, u, d, a) {
        this.type = t;
        this.username = u;
        this.donation = d;
        this.add = a;
        this.alertID = randomUUID();
    }
}

var AlertQueue = []
if (TESTING) {
    print(chalk.red("APP IS IN TESTING MODE"));
    setTimeout(() => {
        AlertQueue.push(new Alert("Membership", "FearDubh", "", addSubAmount))
        countdownAdditionsQueue.push(new Membership());
    }, 2000);

    setTimeout(() => {
        AlertQueue.push(new Alert("SuperChatSticker", "Maxwellicus", "$2.50", addSuperChatAmount))
        countdownAdditionsQueue.push(new SuperChat());
    }, 6000);

    setTimeout(() => {
        AlertQueue.push(new Alert("SuperChat", "HelpThatGuy", "$20.00", addSuperChatAmount))
        countdownAdditionsQueue.push(new SuperChat());
    }, 8000);

    setTimeout(() => {
        AlertQueue.push(new Alert("Membership", "Togi", "", addSubAmount))
        countdownAdditionsQueue.push(new Membership());
    }, 12000);
}

app.ws('/ws/alerts', function (ws, req) {
    setInterval(() => {
        ws.send(JSON.stringify(AlertQueue))
    }, 1000)
});

//control the overlay
app.ws('/ws/control', function (ws, req) {
    //to add a new control type, create a new request type using the template below within the switch statement
    /* 
        case "MyCustomRequest":
            DoMyThing();
            break;
    */
    ws.on('message', function (msg) {
        const data = JSON.parse(msg);
        switch (data.request) {
            case "UpdateMemberAdd":
                addSubAmount = data.value;
                break;
            case "UpdateSuperChatAdd":
                addSuperChatAmount = data.value;
                break;
            case "UpdateEndDate":
                countDownDate = new Date(data.value);
                break;
            case "SaveConfig":
                SaveCountdown();
                break;
            case "PauseResume":
                PauseCountdown();
                break;
            case "NewLiveID":
                LiveID = data.value;
                SaveCountdown();
                break;
        }
    });
});

//date to end the countdown (defaulted to 2029)
var countDownDate = new Date();
if (!LOAD_SAVE)
    countDownDate = new Date("Jan 5, 2029 15:37:25");
else {
    LoadCountdown();
}

var LiveID = "";

app.get('/', (req, res) => {
    if (!loaded)
        res.sendFile(path.join(__dirname, "./pages/index.html"))
    else
        res.sendFile(path.join(__dirname, "./pages/status.html"))
})

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, "./pages/overlay.html"))
})

app.get('/alerts', (req, res) => {
    res.sendFile(path.join(__dirname, "./alerts.html"))
})

app.get('/status', (req, res) => {
    if (loaded)
        res.sendFile(path.join(__dirname, "./pages/status.html"))
    else
        res.sendFile(path.join(__dirname, "./pages/index.html"))
})

//css
app.get('/styles/index', (req, res) => {
    res.sendFile(path.join(__dirname, "./styles/index.css"))
})
app.get('/styles/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, "./styles/overlay.css"))
})
app.get('/styles/alerts', (req, res) => {
    res.sendFile(path.join(__dirname, "./styles/alerts.css"))
})
app.get('/styles/status', (req, res) => {
    res.sendFile(path.join(__dirname, "./styles/status.css"))
})


app.post('/setup', (req, res) => {
    //put pre-init things here
    print(chalk.magenta("Post for setup received! Starting the Memberthon Backend...."));
    res.redirect("/status");
    countDownDate = new Date(req.body.date);
    addSubAmount = req.body.madd;
    addSuperChatAmount = req.body.sadd;
    LiveID = req.body.liveid;
    loaded = true;
    SaveCountdown();
    initServer();
})

app.listen(5653, () => {
    if (OPEN_PAGE)
        open("http://localhost:5653")
    print(chalk.green("Webserver Started!"));
});

var failedStart = false;
var failiureDetails = "None Available";

setTimeout(() => {
    if (loaded)
        initServer();
}, 1000);

async function initServer() {
    print(chalk.yellow("Initializing Server..."));
    /* 
    var chan = await youtube.getChannel(channel).catch(err => {
        failedStart = true;
        failiureDetails = "Failed to fetch this youtube channels information. ERR: \n" + err;
        print("Failed to start, check emitted error.\n" + err);
        return;
    });
    */

    const liveChat = new LiveChat({ liveId: LiveID })

    liveChat.on("error", (err) => {
        print(chalk.red(err));
    })

    liveChat.on("start", (liveId) => {
        print(chalk.green("LiveChat Started!"));
    })

    liveChat.on("chat", (chatItem) => {
        if (paused)
            return;
        //print("[MSG]" + chatItem.author.name + ": " + chatItem.message[0].text);
        if (chatItem.superchat) {
            //print("Superchat: " + chatItem.superchat.amount);
            countdownAdditionsQueue.push(new SuperChat());

            if (chatItem.superchat.sticker != undefined)
                AlertQueue.push(new Alert("SuperChat", chatItem.author.name, chatItem.superchat.amount, addSuperChatAmount))
            else
                AlertQueue.push(new Alert("SuperChat", chatItem.author.name, chatItem.superchat.amount, addSuperChatAmount))

            return;
        }

        if (chatItem.isMembership) {
            //print("Superchat: " + chatItem.superchat.amount);
            countdownAdditionsQueue.push(new Membership());
            AlertQueue.push(new Alert("Membership", chatItem.author.name, 0, addSubAmount))

            return;
        }

        // uncomment this to enable chat time additions

        //countdownAdditionsQueue.push(new Chat());
    })

    const ok = await liveChat.start()
    if (!ok) {
        failedStart = true;
        failiureDetails = "Failed to start the chat listener server. ERR: \n" + err;
        print(chalk.red("Failed to start, check emitted error\n" + err));
        return;
    }
    print(chalk.yellow("Server Initialized!"));

    await StartCountdown();
}

var countdownAdditionsQueue = [];
var countdownAdditions = [];



var countDownString = "";
var countDownInterval = undefined;
async function StartCountdown() {
    StartAutosave();
    print(chalk.green("Started Timer & Auto Save!"));

    countDownInterval = setInterval(() => {

        countdownAdditions = countdownAdditionsQueue;
        countdownAdditionsQueue = [];
        countdownAdditions.forEach(addition => {
            switch (addition.constructor.name) {
                case Membership.name:
                    addMinutes(countDownDate, addSubAmount);

                    break;
                case SuperChat.name:
                    addMinutes(countDownDate, addSuperChatAmount);

                    break;
                case Chat.name:
                    addMinutes(countDownDate, setMinutesTestAmount);
                    break;
            }
        })


        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countDownString = days + "d " + hours + "h " + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) + "m " + seconds + "s ";

        // If the count down is finished
        if (distance < 0) {
            clearInterval(countDownInterval);
            //add code here for countdown finish if you want :)
            process.exit(0)
        }
    }, 1000);
};

var SaveInterval = undefined;
function StartAutosave() {
    SaveInterval = setInterval(() => {
        SaveCountdown();
    }, 20000);
}

function SaveCountdown() {
    if (!loaded) return;
    saving = true;
    print(chalk.yellow("Saving..."));
    var saveDate = countDownDate.toISOString();
    fs.writeFile('./save.json', JSON.stringify({ date: saveDate, memberAdd: addSubAmount, superchatAdd: addSuperChatAmount, liveid: LiveID }), (err) => {
        if (err) throw err;
        print(chalk.green("Saved!"));
        setTimeout(() => {
            saving = false;
        }, 3200);
    });
}

function LoadCountdown() {
    print(chalk.yellow("Loading Save..."));
    if (fs.existsSync("./save.json")) {
        fs.readFile("./save.json", { encoding: 'utf-8' }, (err, data) => {
            if (err) throw err;
            loaded = true;
            var json = JSON.parse(data);
            countDownDate = new Date(json.date);
            addSubAmount = json.memberAdd;
            addSuperChatAmount = json.superchatAdd;
            LiveID = json.liveid;
            print(chalk.green("Loaded Save!"));
        })
    } else {
        loaded = false;
        print(chalk.yellow("Unable to load save as it doesnt exist. defaulting."));
        countDownDate = new Date("Jan 5, 2029 15:37:25");
    }
}

function PauseCountdown() {
    if (paused) {
        paused = false;
        LoadCountdown();
        StartCountdown();
    } else {
        paused = true;
        SaveCountdown();
        clearInterval(SaveInterval);
        clearInterval(countDownInterval)
    }
}


async function open(url) {
    const module = await import('open');
    module.openApp(url);
}

//adds "minutes" to the provided "date".
//thanks to stack overflow for this one, my brain was retarded and i couldnt do the math
function addMinutes(date, minutes) {
    countDownDate = new Date(date.getTime() + minutes * 60000);
}