const maxShots = 8;
var playingField = null;
var titleCard = null;
var gameControls = null;
var playerElement = null;
var shooterElement = null;
var scoreElement = null;
var endScoreCard = null;
var asteroidInterval = null;
var currentNumberOfPellets = 0;
var playerRotation = 0;
var asteroids = [];
var paused = false;
var score = 0;


function initializeGame(restart) {
    if (!playingField || !titleCard || !gameControls || !scoreElement || !endScoreCard) {
        playingField = document.querySelector('#playingField');
        titleCard = document.querySelector("#titleCard");
        gameControls = document.querySelector("#gameControls");
        scoreElement = document.querySelector("#scoreElement");
        endScoreCard = document.querySelector("#endScoreCard");
    }

    if(restart) {
        endGame(true);
    }

    titleCard.classList.add("hidden");
    gameControls.classList.remove("hidden");
    drawPlayer();
    enableControls();
    enableAsteroidSpawning(true);
}

function loadHighScores() {
    
}

function endGame(restart) {
    if (!restart) {
        playingField.removeChild(playerElement);
        asteroids.forEach((ast) => {
            clearInterval(ast.moveInterval);
            playingField.removeChild(ast.element);
        });
    }

    disableAsteroidSpawning();
    disableControls();
    playerElement = null;
    shooterElement = null;
    currentNumberOfPellets = 0;
    playerRotation = 0;
    asteroids = [];
    paused = false;
    score = 0;
    scoreElement.innerHTML = score.toString();
    if (!restart) titleCard.classList.remove("hidden");
    if (restart) endScoreCard.classList.add("hidden");
    gameControls.classList.add("hidden");
    playingField.classList.remove("paused");
}

function deathPauseGame() {
    pauseGame(true);
    gameControls.classList.add("hidden");

    setTimeout(() => {
        asteroids.forEach((ast) => {
            clearInterval(ast.moveInterval);
            playingField.removeChild(ast.element);
        });
        paused = false;
        document.querySelector("#endScoreElement").innerHTML = score;
        playingField.classList.remove("paused");
        endScoreCard.classList.remove("hidden");
    }, 2000);
}

function pauseGame(force) {
    if (!paused || force) {
        paused = true;
        playingField.classList.add("paused");
        disableControls();
        disableAsteroidSpawning();
    } else {
        paused = false;
        playingField.classList.remove("paused");
        enableControls();
        enableAsteroidSpawning(false);
    }
}

function drawPlayer() {
    var player = document.createElement("div");
    var shooter = document.createElement("div");

    player.classList.add("player");
    shooter.classList.add("shooter");

    playingField.append(player);
    player.append(shooter);

    playerElement = player;
    shooterElement = shooter;
}

function enableControls() {
    document.addEventListener("keydown", handleMovement);
    document.addEventListener("keydown", handleShooting);
}

function disableControls() {
    document.removeEventListener("keydown", handleMovement);
    document.removeEventListener("keydown", handleShooting);
}

function handleMovement() {
    if (event.code === "ArrowLeft") {
        if (playerRotation-5 < 0) playerRotation = 360;
        playerRotation -= 5;
    } else if (event.code === "ArrowRight") {
        if (playerRotation+5 > 360) playerRotation = 0;
        playerRotation += 5;
    }
    playerElement.style.transform = `rotate(${playerRotation}deg)`;
}

function handleShooting() {
    if (event.code === "Space" && !event.repeat && currentNumberOfPellets < maxShots) {
        currentNumberOfPellets++;
        var pellet = document.createElement("div");
        pellet.classList.add("pellet");
        var rect = shooterElement.getBoundingClientRect();
        pellet.style.left = `${rect.x}px`;
        pellet.style.top = `${rect.y}px`;
        pellet.style.transform = `rotate(${playerRotation}deg)`;

        playingField.append(pellet);
        
        let left = parseInt(pellet.style.left.slice(0, -2));
        let top = parseInt(pellet.style.top.slice(0, -2));
        let rotation = playerRotation;

        let i = 0;
        let interval = setInterval(() => {
            if (paused) return;
            i++;
            let newPos = calcMovement(left, top, rotation, 10 * i);
            pellet.style.left = `${newPos.x}px`;
            pellet.style.top = `${newPos.y}px`; 

            let collision = checkForCollision(pellet);
            if (collision) {
                pellet.parentNode.removeChild(pellet);
                currentNumberOfPellets--;
                handlePelletHit(collision);
                clearInterval(interval);
                return;
            };
        }, 1000/60);

        let pelletTimeout = setTimeout(() => {
            try {
                if (pellet.parentNode) {
                    clearInterval(interval);
                    currentNumberOfPellets--;
                    pellet.parentNode.removeChild(pellet);
                }
            } catch(ex) {
                console.log("error pellet");
            }
        }, 2000);
    }
}

function handlePelletHit(asteroid) {
    asteroid.health--;
    if (asteroid.health === 0) {
        score += asteroid.level*100;
        scoreElement.innerHTML = score.toString();
        clearInterval(asteroid.moveInterval);
        asteroids.splice(asteroids.findIndex((ast) => {return ast === asteroid}),1);
        let astRect = asteroid.element.getBoundingClientRect();
        playingField.removeChild(asteroid.element);
        if (asteroid.level > 2) {
            for (let i = 0; i < asteroid.level; i++) {
                spawnAsteroid(asteroid.level-2, astRect.x, astRect.y);
            }
        }
    }
}

function calcMovement(x, y, rotation, speed) {
    let newX = x, newY = y;
    newX = x + ((-speed) * Math.cos(rotation * (Math.PI/180)));
    newY = y + ((-speed) * Math.sin(rotation * (Math.PI/180)));

    return {x: newX, y: newY};
}

function checkForCollision(pellet) {
    let pRect = pellet.getBoundingClientRect();
    let asteroid = null;
    asteroids.map((ast) => {
        let astRect = ast.element.getBoundingClientRect();
        var coll = !(pRect.right < astRect.left || 
            pRect.left > astRect.right || 
            pRect.bottom < astRect.top || 
            pRect.top > astRect.bottom);
        if (coll) {
            asteroid = ast;
            return;
        }
    })
    return asteroid;
}

function checkPlayerCollision(astRect) {
    let pRect = playerElement.getBoundingClientRect();
    var coll = !(pRect.right < astRect.left || 
        pRect.left > astRect.right || 
        pRect.bottom < astRect.top || 
        pRect.top > astRect.bottom);
    if (coll) return true;
    return false;
}

function lerp (start, end, amt){
    return (1-amt)*start+amt*end;
}

function spawnAsteroid(level, x, y) {
    var asteroid = {};
    var asteroidLevel = level ? level : Math.ceil((Math.random() * 5));
    asteroid.element = document.createElement("div");
    asteroid.element.classList.add("asteroid");
    asteroid.element.classList.add(`asteroid-${asteroidLevel}`);
    asteroid.element.style.top = y ? `${Math.abs((Math.random() * 50 * level) + y)}px` : `${Math.abs((Math.random() * window.innerHeight))}px`;
    asteroid.element.style.left = x ? `${Math.abs((Math.random() * 50 * level) + x)}px` : `${Math.abs((Math.random() * window.innerWidth))}px`;
    playingField.append(asteroid.element);

    
    asteroid.moveInterval = setInterval(() => {
        if (paused) return;
        var rect = playerElement.getBoundingClientRect();
        var astRect = asteroid.element.getBoundingClientRect();
        asteroid.element.style.left = `${lerp(astRect.x, rect.x, 0.001)}px`;
        asteroid.element.style.top = `${lerp(astRect.y, rect.y, 0.001)}px`;
        let hitPlayer = checkPlayerCollision(astRect);
        if (hitPlayer) {
            clearInterval(asteroid.moveInterval);
            playingField.removeChild(asteroid.element);
            playingField.removeChild(playerElement);
            asteroids.splice(asteroids.findIndex((ast) => {return ast === asteroid}),1);
            deathPauseGame();
        }
    }, 1000/60);

    asteroid.health = asteroidLevel;
    asteroid.level = asteroidLevel;
    asteroids.push(asteroid);
}

function enableAsteroidSpawning(iniSpawn) {
    if (iniSpawn) spawnAsteroid(4);
    asteroidInterval = setInterval(() => {
        spawnAsteroid();
    }, 5000);
}

function disableAsteroidSpawning() {
    clearInterval(asteroidInterval);
    asteroidInterval = null;
}

