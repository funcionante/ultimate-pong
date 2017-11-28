console.clear();

// "constants"...
var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight,
    VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 15000,
    FIELD_WIDTH = 1200,
    FIELD_LENGTH = 3000,
    BALL_RADIUS = 20,
    BALL_JUMP_POSITION = 0,
    CAMERA_MIN_HEIGHT = 200,
    CAMERA_MAX_HEIGHT = 800,
    CAMERA_MIN_DISTANCE = (FIELD_LENGTH / 2 + 500),
    GAME_OVER = 10,

    //get the scoreboard element.
    player_1_score,
    player_2_score,

    //playerPower
    player_1_power,
    player_2_power,

    //declare members.
    container, renderer, primaryCamera, mainLight, moon, secondCamera,
    scene, ball, paddle1, paddle2, field, running,multiplayer = false,
    score = {
        player1: 0,
        player2: 0
    },
    player_1_paddle = {dimension: {z: 10, y: 30, x: 200}, color: 0xAA3333, autopilot: false},
    player_2_paddle = {dimension: {z: 10, y: 30, x: 200}, color: 0x3F51B5, autopilot: false},
    trapWall = {color: 0xFF0000, width: 575, startDim: {x: 50, y: 10, z: 50}, dimension: {x: 0, y: 0, z: 50}, timestamp: 0, status: "inactive"},
    player1Item = "none",
    player2Item = "none",
    fieldItem = {name: "", instance: "", dimension: {x: 50, y: 50, z: 50}, timestamp: Date.now()},
    farItem = {status: "inactive", player: 0},
    freezeBall = {instance: "", status: "inactive", color: 0xB4CFFA, player: 0, radius: 10, pos: 0, freeze: 0},
    fieldRotation = {player: 0, status: "inactive"},
    ballControl = {player: 0, status: "inactive", timestamp: 0},
    paddleIncrease = {player: 0, status: "inactive", timestamp: 0},
    itemDirection = 1,
    backgroundSphere,
    cameraPosition = {height: {player1: CAMERA_MIN_HEIGHT, player2: CAMERA_MIN_HEIGHT}, distance: {player1: CAMERA_MIN_DISTANCE, player2: -CAMERA_MIN_DISTANCE}},
    moonAngle = 4.5;

function gameOver(){
    if(score.player1 >= GAME_OVER){
        $('#result_player').text("PLAYER 1 WIN!");
        $('#result').show();
        stopBall();
    }
    else if(score.player2 >= GAME_OVER){
        $('#result_player').text("PLAYER 2 WIN!");
        $('#result').show();
        stopBall();
    }
}

function startGame(players){
    $('body').css("background-color","white");
    if(players === 1){
        multiplayer = false;
        $('#upper_content').append('<div id="player_2_score" class="player_score player_2_score" style="right: 5px; top: 5px;position:relative;float: right"> 0 </div> <div id="player_1_score" class="player_score player_1_score" style="right: -40px; top: 55px;position:relative;float: right"> 0 </div>');
        $('#player_1_power').show();
    }
    else if(players === 2){
        multiplayer = true;
        $('#upper_content').append('<div id="player_1_score" class="multiplayer player_score player_1_score" style="right: 5px; top: 5px;position:relative;float: right"> 0 </div>');
        $('#lower_content').append('<div id="player_2_score" class="multiplayer player_score player_2_score" style="right: 5px; top: 5px;position:relative;float: right"> 0 </div>');
        $('#player_1_power').show();
        $('#player_2_power').show();
    }

    if($('#difficulty').is(":checked")){
        fieldItem.dimension.x *= 2;
        fieldItem.dimension.y *= 2;
        fieldItem.dimension.z *= 2;

    }
    else{
        player_1_paddle.dimension.x /= 2;
        player_2_paddle.dimension.x /= 2;
    }

    $( "#menu" ).hide();

    //get the scoreboard element.
    player_1_score = document.getElementById('player_1_score'),
    player_2_score = document.getElementById('player_2_score'),

    //playerPower
    player_1_power = document.getElementById('player_1_power'),
    player_2_power = document.getElementById('player_2_power'),

    init();
}

function increasePaddle(player){
    if(paddleIncrease.status === "inactive"){
        paddleIncrease.status = "active";
        paddleIncrease.player = player;
        paddleIncrease.timestamp = Date.now();

        var inc = 2.5;

        if(player === 1){
            paddle1.scale.x *= inc;
            player_1_paddle.dimension.x *= inc;
            paddle2.scale.x /= inc;
            player_2_paddle.dimension.x /= inc;
        }
        else if(player === 2) {
            paddle2.scale.x *= inc;
            player_2_paddle.dimension.x *= inc;
            paddle1.scale.x /= inc;
            player_1_paddle.dimension.x /= inc;
        }
    }
}

function decreasePaddle(){
    if(paddleIncrease.status === "active" && paddleIncrease.timestamp + 15000 < Date.now()){
        var inc = 2.5;

        if(paddleIncrease.player === 1){
            paddle1.scale.x /= inc;
            player_1_paddle.dimension.x /= inc;
            paddle2.scale.x *= inc;
            player_2_paddle.dimension.x *= inc;
        }
        else if(paddleIncrease.player === 2){
            paddle2.scale.x /= inc;
            player_2_paddle.dimension.x /= inc;
            paddle1.scale.x *= inc;
            player_1_paddle.dimension.x *= inc;
        }

        paddleIncrease.status = "inactive";
        paddleIncrease.player = 0;
        paddleIncrease.timestamp = 0;
    }
}

function startBallMovement() {
    var direction = Math.random() > 0.5 ? -1 : 1;
    ball.$velocity = {
        x: 0,
        z: direction * 20
    };
    ball.$stopped = false;
}

function activateRotation(player){
    fieldRotation.player = player;
    fieldRotation.status = "active";
}

function executeRotation(){
    if(fieldRotation.status === "active"){
        if(fieldRotation.player === 1){
            if(secondCamera.rotation.z <= 5 * Math.PI){
                secondCamera.rotation.z += 0.1;
                if(secondCamera.rotation.z > 5 * Math.PI){
                    secondCamera.rotation.z = Math.PI;
                    fieldRotation.status = "inactive";
                }
            }
        }
        else if(fieldRotation.player === 2){
            if(primaryCamera.rotation.z <= 4 * Math.PI){
                primaryCamera.rotation.z += 0.1;
                if(primaryCamera.rotation.z > 4 * Math.PI){
                    primaryCamera.rotation.z = 0;
                    fieldRotation.status = "inactive";
                }
            }
        }
    }
}

function processCpuPaddle() {
    var ballPos = ball.position,
        cpuPos = paddle2.position;

    if (cpuPos.x - 100 > ballPos.x) {
        cpuPos.x -= Math.min(cpuPos.x - ballPos.x, 6);
    }
    else if (cpuPos.x - 100 < ballPos.x) {
        cpuPos.x += Math.min(ballPos.x - cpuPos.x, 6);
    }
}

function processBallMovement() {
    if (!ball.$velocity) {
        startBallMovement();
    }

    if (ball.$stopped) {
        return;
    }

    updateBallPosition();

    if (isSideCollision() === "left") {
        if(ball.$velocity.x > 0){
            ball.$velocity.x *= -1;
        }
    }
    else if (isSideCollision() === "right") {
        if(ball.$velocity.x < 0){
            ball.$velocity.x *= -1;
        }
    }

    // IF HIT PADDLE 1
    if (ballObjectCollision(ball,paddle1,BALL_RADIUS,player_1_paddle.dimension)){
        hitBallBack(paddle1);
    }

    if(trapWall.status !== "inactive"){
        // if hit the left wall
        if (ballObjectCollision(ball,trapWall.left,BALL_RADIUS,trapWall.dimension)){
            hitBallBackWall(trapWall.left);
        }

        // if hit the right wall
        if (ballObjectCollision(ball,trapWall.right,BALL_RADIUS,trapWall.dimension)){
            hitBallBackWall(trapWall.right);
        }
    }


    // IF HIT PADDLE 2
    if (ballObjectCollision(ball,paddle2,BALL_RADIUS,player_2_paddle.dimension)){
        hitBallBack(paddle2);
    }

    // if item exists, rotate
    if(fieldItem.instance !== ""){
        fieldItem.instance.rotation.y += 0.1;

        if (fieldItem.instance.position.y >= 70){
            itemDirection = -1;
        }
        else if(fieldItem.instance.position.y <= 50){
            itemDirection = 1;
        }

        fieldItem.instance.position.y += itemDirection;

        // if hit the item, gain power
        if (ballObjectCollision(ball,fieldItem.instance,BALL_RADIUS,fieldItem.dimension)){
            if(fieldItem.name === "trapWall"){
                if(trapWall.status === "inactive"){
                    activateTripWall();
                }
            }
            else if(fieldItem.name === "farLimiter"){
                if(farItem.status === "inactive") {
                    if(ball.$velocity.z < 0) {
                        farItem.player = 1;
                    }
                    else{
                        farItem.player = 2;
                    }
                    farItem.status = "active";
                }
            }
            else if(fieldItem.name === "paddleIncrease"){
                if(ball.$velocity.z < 0) {
                    increasePaddle(1);
                }
                else{
                    increasePaddle(2);
                }
            }
            else{
                if(ball.$velocity.z < 0){
                    gainPower(fieldItem.name,1);
                }
                else{
                    gainPower(fieldItem.name,2);
                }
            }

            scene.remove(fieldItem.instance);
            fieldItem.instance = "";
        }
    }

    if (isPastPaddle1()) {
        scoreBy('player2');
    }

    if (isPastPaddle2()) {
        scoreBy('player1');
    }
}

function isPastPaddle1() {
    return ball.position.z > paddle1.position.z + 100;
}

function gainPower(itemName, playerNumber){
    if(playerNumber === 1){
        player1Item = itemName;
        player_1_power.innerHTML ='<img src="images/items/'+itemName+'.jpg" height="40px" width="40px">';
    }
    else if(playerNumber === 2){
        player2Item = itemName;
        player_2_power.innerHTML ='<img src="images/items/'+itemName+'.jpg" height="40px" width="40px">';
    }
}

function loosePower(playerNumber){
    if(playerNumber === 1){
        player1Item = "none";
        player_1_power.innerHTML ='<img src="images/items/none.jpg" height="40px" width="40px">';
    }
    else if(playerNumber === 2){
        player2Item = "none";
        player_2_power.innerHTML ='<img src="images/items/none.jpg" height="40px" width="40px">';
    }
}

function isPastPaddle2() {
    return ball.position.z < paddle2.position.z - 100;
}

function updateBallPosition() {
    var ballPos = ball.position;

    //ball rotation
    ball.rotation.x += ball.$velocity.z/70; // foreword
    ball.rotation.z += ball.$velocity.x/70; // side

    //update the ball's position.
    ballPos.x += ball.$velocity.x;
    ballPos.z += ball.$velocity.z;
    ballPos.y = 0;

    if(BALL_JUMP_POSITION !== 0){
        if(ball.$velocity.z > 0){
            ballPos.y = -(ballPos.z-BALL_JUMP_POSITION)*(ballPos.z-1400-BALL_JUMP_POSITION)/1000;
        }
        else{
            ballPos.y = -(ballPos.z-BALL_JUMP_POSITION)*(ballPos.z+1400-BALL_JUMP_POSITION)/1000;
        }

        if(ballPos.y <= 0){
            BALL_JUMP_POSITION = 0;
        }
    }
}

function isSideCollision() {
    var ballX = ball.position.x,
        halfFieldWidth = FIELD_WIDTH / 2;

    if(ballX - BALL_RADIUS <= -halfFieldWidth+20){
        return "right";
    }
    else if(ballX + BALL_RADIUS >= halfFieldWidth-20) {
        return "left";
    }
    else{
        return null;
    }
}

function hitBallBack(paddle) {
    ball.$velocity.x = (ball.position.x - paddle.position.x) / 5;
    ball.$velocity.z *= -1;
}

function wallSide(wall){
    if(wall.position.z > ball.position.z){
        return "front";
    }
    else{
        return "back";
    }
}

function hitBallBackWall(wall) {
    ball.$velocity.x = (ball.position.x - wall.position.x) / 10;
    if(wallSide(wall) === "front" && ball.$velocity.z > 0){
        ball.$velocity.z *= -1;
    }
    else if(wallSide(wall) === "back" && ball.$velocity.z < 0){
        ball.$velocity.z *= -1;
    }
}

function ballObjectCollision(ballObject,object,ball_radius,object_dims){
    var collision = false;

    // x coordinate collision1
    var object_left_x_limit = object.position.x - object_dims.x / 2,
        object_right_x_limit = object.position.x + object_dims.x / 2,
        ball_left_x_limit = ballObject.position.x - ball_radius,
        ball_right_x_limit = ballObject.position.x + ball_radius;

    if(object_left_x_limit < ball_left_x_limit || object_left_x_limit < ball_right_x_limit){
        collision = true;
    }
    else{
        return false;
    }

    if(object_right_x_limit > ball_left_x_limit || object_right_x_limit > ball_right_x_limit){
        collision = true;
    }
    else{
        return false;
    }

    // y coordinate collision
    var object_left_y_limit = object.position.y - object_dims.y / 2,
        object_right_y_limit = object.position.y + object_dims.y / 2,
        ball_left_y_limit = ballObject.position.y - ball_radius,
        ball_right_y_limit = ballObject.position.y + ball_radius;

    if(object_left_y_limit < ball_left_y_limit || object_left_y_limit < ball_right_y_limit){
        collision = true;
    }
    else{
        return false;
    }

    if(object_right_y_limit > ball_left_y_limit || object_right_y_limit > ball_right_y_limit){
        collision = true;
    }
    else{
        return false;
    }

    // z coordinate collision
    var object_left_z_limit = object.position.z - object_dims.z / 2,
        object_right_z_limit = object.position.z + object_dims.z / 2,
        ball_left_z_limit = ballObject.position.z - ball_radius,
        ball_right_z_limit = ballObject.position.z + ball_radius;

    if(object_left_z_limit < ball_left_z_limit || object_left_z_limit < ball_right_z_limit){
        collision = true;
    }
    else{
        return false;
    }

    if(object_right_z_limit > ball_left_z_limit || object_right_z_limit > ball_right_z_limit){
        collision = true;
    }
    else{
        return false;
    }

    return collision;
}

function ballJump(ball){
    BALL_JUMP_POSITION = ball.position.z;
}

function scoreBy(playerName) {
    addPoint(playerName);
    updateScoreBoard();
    stopBall();
    setTimeout(reset, 2000);
}

function updateScoreBoard() {
    player_1_score.innerHTML = score.player1;
    player_2_score.innerHTML = score.player2;
}

function stopBall() {
    ball.$stopped = true;
}

function addPoint(playerName) {
    score[playerName]++;
    trapWall.status = "closing";
}

function startRender() {
    running = true;
    render();
}

function stopRender() {
    running = false;
}

function paddleControl(){
    // player 1 go left
    if(Key.isDown(65)){
        if(ballControl.status === "active" && ballControl.player === 1){
            ballHijack(-1);
        }
        else if (paddle1.position.x > -(600-player_1_paddle.dimension.x/2)){
            paddle1.position.x -= 10;
            primaryCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }

    }

    // player 1 go right
    if(Key.isDown(68)){
        if(ballControl.status === "active" && ballControl.player === 1){
            ballHijack(+1);
        }
        else if(paddle1.position.x < (600-player_1_paddle.dimension.x/2)){
            paddle1.position.x += 10;
            primaryCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 2 go left
    if(Key.isDown(37)){
        if(ballControl.status === "active" && ballControl.player === 2){
            ballHijack(-1);
            paddle2.position.x = ball.position.x;
        }
        else if (paddle2.position.x < (600-player_2_paddle.dimension.x/2)){
            paddle2.position.x += 10;
            secondCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 2 go right
    if(Key.isDown(39)){
        if(ballControl.status === "active" && ballControl.player === 2){
            ballHijack(+1);
            paddleAutopilot(1);
            paddle2.position.x = ball.position.x;
        }
        else if (paddle2.position.x > -(600-player_2_paddle.dimension.x/2)){
            paddle2.position.x -= 10;
            secondCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 1 camera up
    if(Key.isDown(87)){
        if (cameraPosition.height.player1 < CAMERA_MAX_HEIGHT) {
            cameraPosition.height.player1 += 10;
            cameraPosition.distance.player1 += 10;

            primaryCamera.position.y = cameraPosition.height.player1;
            primaryCamera.position.z = cameraPosition.distance.player1;
            primaryCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 1 camera down
    if(Key.isDown(83)){
        if (cameraPosition.height.player1 > CAMERA_MIN_HEIGHT) {
            cameraPosition.height.player1 -= 10;
            cameraPosition.distance.player1 -= 10;

            primaryCamera.position.y = cameraPosition.height.player1;
            primaryCamera.position.z = cameraPosition.distance.player1;
            primaryCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 2 camera up
    if(Key.isDown(38)){
        if (cameraPosition.height.player2 < CAMERA_MAX_HEIGHT) {
            cameraPosition.height.player2 += 10;
            cameraPosition.distance.player2 -= 10;

            secondCamera.position.y = cameraPosition.height.player2;
            secondCamera.position.z = cameraPosition.distance.player2;
            secondCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 2 camera down
    if(Key.isDown(40)){
        if (cameraPosition.height.player2 > CAMERA_MIN_HEIGHT) {
            cameraPosition.height.player2 -= 10;
            cameraPosition.distance.player2 += 10;

            secondCamera.position.y = cameraPosition.height.player2;
            secondCamera.position.z = cameraPosition.distance.player2;
            secondCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
        }
    }

    // player 1 special power
    if(Key.isDown(32)){
        switch (player1Item){
            case "jump":
                ballJump(ball);
                loosePower(1);
                break;
            /*case "farLimiter":
                if(farItem.status === "inactive"){
                    farItem.player = 1;
                    farItem.status = "active";
                    loosePower(1);
                }
                break;*/
            case "baskIceBall":
                if(freezeBall.status === "inactive"){
                    freezeBall.player = 1;
                    freezeBall.status = "active";
                    freezeBall.instance = createFreezeBall(1);
                    freezeBall.status = "moving";
                    loosePower(1);
                }
                break;
            case "rotation":
                if(fieldRotation.status === "inactive"){
                    activateRotation(1);
                    loosePower(1);
                }
                break;
            case "ballControl":
                if(ballControl.status === "inactive"){
                    ballControl.player = 1;
                    ballControl.status = "active";
                    ballControl.timestamp = Date.now();
                    player_1_paddle.autopilot = true;
                    loosePower(1);
                }
                break;
            /*case "paddleIncrease":
                if(paddleIncrease.status === "inactive") {
                    increasePaddle(1);
                    loosePower(1);
                }
                break;*/
        }
    }

    // player 2 special power
    if(Key.isDown(190)){
        switch (player2Item){
            case "jump":
                ballJump(ball);
                loosePower(2);
                break;
            /*case "farLimiter":
                if(farItem.status === "inactive"){
                    farItem.player = 2;
                    farItem.status = "active";
                    loosePower(2);
                }
                break;*/
            case "baskIceBall":
                if(freezeBall.status === "inactive"){
                    freezeBall.player = 2;
                    freezeBall.status = "active";
                    freezeBall.instance = createFreezeBall(2);
                    freezeBall.status = "moving";
                    loosePower(2);
                }
                break;
            case "rotation":
                if(fieldRotation.status === "inactive"){
                    activateRotation(2);
                    loosePower(2);
                }
                break;
            case "ballControl":
                if(ballControl.status === "inactive"){
                    ballControl.player = 2;
                    ballControl.status = "active";
                    ballControl.timestamp = Date.now();
                    player_2_paddle.autopilot = true;
                    loosePower(2);
                }
                break;
            /*case "paddleIncrease":
                if(paddleIncrease.status === "inactive") {
                    increasePaddle(2);
                    loosePower(2);
                }
                break;*/
        }
    }

    // CHEATS PLAYER 1
    if(Key.isDown(49)){
        if(paddleIncrease.status === "inactive") {
            increasePaddle(1);
        }
    }

    if(Key.isDown(50)){
        gainPower("jump", 1);
    }

    if(Key.isDown(51)){
        gainPower("baskIceBall", 1);
    }

    if(Key.isDown(52)){
        gainPower("rotation", 1);
    }

    if(Key.isDown(53)){
        gainPower("ballControl", 1);
    }

    if(Key.isDown(54)){
        if(farItem.status === "inactive") {
            farItem.player = 1;
            farItem.status = "active";
        }
    }

    // GENERAL CHEATS

    if(Key.isDown(48)){
        activateTripWall();
    }
}

function paddleAutopilot(){
    if(ballControl.player === 1){
        paddle1.position.x = ball.position.x;
    }

    else if(ballControl.player === 2){
        paddle2.position.x = ball.position.x;
    }
}

function ballHijack(mov){
    var velX = ball.$velocity.x;
    var velZ = ball.$velocity.z;

    // CHANGING DIRECTION ACCORDING TO CIRCULAR MOVEMENT
    if(velZ > 0 && velX <= 0){
        velZ -= 1 * mov;
        velX -= 1 * mov;
    }
    else if(velZ <= 0 && velX < 0){
        velZ -= 1 * mov;
        velX += 1 * mov;
    }
    else if(velZ < 0 && velX >= 0){
        velZ += 1 * mov;
        velX += 1 * mov;
    }
    else if(velZ >= 0 && velX > 0){
        velZ += 1 * mov;
        velX -= 1 * mov;
    }

    ball.$velocity.x = velX;
    ball.$velocity.z = velZ;
}

function cameraTracking(){
    if(ballControl.status === "active"){
        if(ballControl.timestamp + 5000 < Date.now() || ball.$velocity === null){
            ballControl.status = "inactive";
            cameraReset(ballControl.player);
            ballControl.player = 0;
            ballControl.timestamp = 0;
        }

        if(ballControl.player === 1){
            // ball camera control
            primaryCamera.position.x = ball.position.x + ball.$velocity.x * 10 * -1;
            primaryCamera.position.z = ball.position.z + ball.$velocity.z * 10 * -1;
            primaryCamera.position.y = 50;
            primaryCamera.lookAt(ball.position);

            // other player default camera
            secondCamera.position.x = paddle2.position.x;
        }
        else if(ballControl.player === 2){
            // ball camera control
            secondCamera.position.x = ball.position.x + ball.$velocity.x * 10 * -1;
            secondCamera.position.z = ball.position.z + ball.$velocity.z * 10 * -1;
            secondCamera.position.y = 50;
            secondCamera.lookAt(ball.position);

            // other player default camera
            primaryCamera.position.x = paddle1.position.x;
        }
    }
    else{
        secondCamera.position.x = paddle2.position.x;
        primaryCamera.position.x = paddle1.position.x;
    }

}

function cameraReset(player){
    if(player === 1){
        paddle1.position.z = FIELD_LENGTH / 2;
        paddle1.position.x = 0;
        primaryCamera.position.set(0, cameraPosition.height.player1, cameraPosition.distance.player1);
        primaryCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
    }
    else if(player === 2){
        paddle2.position.z = - FIELD_LENGTH / 2;
        paddle2.position.x = 0;
        secondCamera.position.set(0, cameraPosition.height.player2, cameraPosition.distance.player2);
        secondCamera.lookAt(new THREE.Vector3( 0, 0, 0 ));
    }
}

function moveMoon() {
    moonAngle += 0.01;
    moon.position.x = Math.sin( moonAngle ) * 1500;
    moon.position.y = Math.cos( moonAngle ) * 1500;
    moon.position.z = Math.sin( moonAngle ) * 1500;
}

function render() {
    var SCREEN_W = WIDTH;
    var SCREEN_H = HEIGHT;

    var left, bottom, width, height;

    if(multiplayer){
        left = 1;
        bottom = 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.setScissorTest(true);
        secondCamera.aspect = width / height;
        secondCamera.updateProjectionMatrix();
        renderer.render(scene, secondCamera);

        left = 1;
        bottom = 0.5 * SCREEN_H + 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.setScissorTest(true); // clip out "viewport"
        primaryCamera.aspect = width / height;
        primaryCamera.updateProjectionMatrix();
        renderer.render(scene, primaryCamera);
    }
    else{
        left = 1;
        bottom = 0;
        width = SCREEN_W;
        height = SCREEN_H;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.setScissorTest(true); // clip out "viewport"
        primaryCamera.aspect = width / height;
        primaryCamera.updateProjectionMatrix();
        renderer.render(scene, primaryCamera);
    }

    if (running) {

        requestAnimationFrame(render);

        // checking if score is past 10 points
        gameOver();

        // single-player game
        if(!multiplayer){
            processCpuPaddle();
        }
        // camera following paddle
        cameraTracking();

        // move sun
        moveMoon();

        // rotation item
        executeRotation();

        // paddle autopilot if needed
        paddleAutopilot();

        // paddle decrease
        decreasePaddle();

        if(farItem.status === "active"){
            if(farItem.far <= 500){
                farItem.status = "inactive";
                farItem.far = FAR;
                primaryCamera.far = FAR;
                secondCamera.far = FAR;
            }
            else{
                reducePlayerFar(farItem.player);
            }
        }

        if(trapWall.status === "active"){
            if(trapWall.left.position.x < -325 && trapWall.right.position.x > 325){
                wallBuild();
            }
            else{
                trapWall.status = "moving";
            }
        }
        else if(trapWall.timestamp + 50000 < Date.now()){
            if(trapWall.left.position.y > -75){
                wallRemove();
            }
            else{
                trapWall.status = "inactive";
            }
        }
        else if(trapWall.status === "moving"){
            // wall advances on target
            if(trapWall.left.position.z <= 950 && trapWall.left.position.z >= -950){
                if(ball.position.z > trapWall.left.position.z){
                    trapWall.left.position.z += 3;
                    trapWall.right.position.z += 3;
                }
                else{
                    trapWall.left.position.z -= 3;
                    trapWall.right.position.z -= 3;
                }
            }
            else{
                trapWall.status = "closing";
            }
        }
        else if(trapWall.status === "closing"){
            if(trapWall.left.position.y > -75){
                wallRemove();
            }
            else{
                trapWall.status = "inactive";
            }
        }

        processBallMovement();
        //processCpuPaddle();
        paddleControl();

        if(freezeBall.status === "freeze"){
            if(freezeBall.timestamp + 3000 < Date.now()){
                unfreezePlayer(freezeBall.freeze);
            }

            if(freezeBall.freeze === 1){
                paddle1.position.x = freezeBall.pos;
            }
            else if(freezeBall.freeze === 2){
                paddle2.position.x = freezeBall.pos;
            }
        }

        if(freezeBall.status === "moving"){
            if(freezeBall.instance.position.z >= 1500 || freezeBall.instance.position.z <= -1500){
                unfreezePlayer(0);
                destroyFreezeBall();
            }
            else if(ballObjectCollision(freezeBall.instance,paddle2,freezeBall.radius,player_2_paddle.dimension) ||
                ballObjectCollision(freezeBall.instance,paddle1,freezeBall.radius,player_1_paddle.dimension)){
                freezeBall.status = "freeze";

                if(freezeBall.player === 1){
                    freezeBall.freeze = 2;
                    paddle2.material.color.setHex(freezeBall.color);
                    freezeBall.pos = paddle2.position.x;
                }
                else if(freezeBall.player === 2){
                    freezeBall.freeze = 1;
                    paddle1.material.color.setHex(freezeBall.color);
                    freezeBall.pos = paddle1.position.x;
                }

                freezeBall.timestamp = Date.now();

                destroyFreezeBall();
            }
            else{
                moveFreezeBall(freezeBall.player);
            }

        }

        if(fieldItem.timestamp + 5000 + Math.floor((Math.random() * 1000) + 1) < Date.now()){
            if(fieldItem.instance === ""){
                fieldItem.timestamp = Date.now();

                var randomItem = Math.floor((Math.random() * 70) + 1);

                if(randomItem < 10){
                    fieldItem.name = "jump";
                    fieldItem.instance = generateRandomItem();
                }
                else if(randomItem < 20){
                    fieldItem.name = "farLimiter";
                    fieldItem.instance = generateRandomItem();
                }
                else if(randomItem < 30){
                    fieldItem.name = "baskIceBall";
                    fieldItem.instance = generateRandomItem();
                }
                else if(randomItem < 40){
                    fieldItem.name = "rotation";
                    fieldItem.instance = generateRandomItem();
                }
                else if(randomItem < 50){
                    fieldItem.name = "paddleIncrease";
                    fieldItem.instance = generateRandomItem();
                }
                else if(randomItem < 60){
                    fieldItem.name = "ballControl";
                    fieldItem.instance = generateRandomItem();
                }
                else{
                    fieldItem.name = "trapWall";
                    fieldItem.instance = generateRandomItem();
                }
            }
        }
    }
}

function unfreezePlayer(player){
    freezeBall.status = "inactive";
    freezeBall.player = 0;
    freezeBall.pos = 0;

    if(player === 1){
        paddle1.material.color.setHex(player_1_paddle.color);
    }
    else if(player === 2){
        paddle2.material.color.setHex(player_2_paddle.color);
    }
}

function destroyFreezeBall(){
    scene.remove(freezeBall.instance);
    freezeBall.instance = "";
}

function activateTripWall(){
    // remove old walls from scene
    scene.remove(trapWall.left);
    scene.remove(trapWall.right);

    // restart trapWall dimensions
    trapWall.dimension = {x: 0, y: 0, z: 50};

    // generate trapWall objects
    trapWall.left = generateTrapWall(-trapWall.width);
    trapWall.right = generateTrapWall(trapWall.width);

    trapWall.status = "active";
    trapWall.timestamp = Date.now();
}

function wallBuild(){
    // wall gaining height
    if(trapWall.left.position.y < 100){
        trapWall.left.scale.y += 0.4;
        trapWall.left.position.y += 2;

        trapWall.right.scale.y += 0.4;
        trapWall.right.position.y += 2;

        trapWall.dimension.y += trapWall.startDim.y * 0.4;
    }

    if(trapWall.left.position.y >= 100 && trapWall.right.position.y >= 100){
        // wall joining
        if(trapWall.left.position.x <= -325){
            trapWall.left.scale.x += 0.03;
            trapWall.left.position.x += 0.75;

            trapWall.right.scale.x += 0.03;
            trapWall.right.position.x -= 0.75;

            trapWall.dimension.x += trapWall.startDim.x * 0.03;
        }
    }
}

function wallRemove(){
    // wall separation
    if(trapWall.left.position.x >= -575){
        trapWall.left.scale.x -= 0.03;
        trapWall.left.position.x -= 0.75;

        trapWall.right.scale.x -= 0.03;
        trapWall.right.position.x += 0.75;

        trapWall.dimension.x -= trapWall.startDim.x * 0.03;
    }

    if(trapWall.left.position.x <= -100 && trapWall.right.position.x >= 100){
        // wall loose height
        if(trapWall.left.position.y > -75){
            trapWall.left.scale.y -= 0.1;
            trapWall.left.position.y -= 0.5;

            trapWall.right.scale.y -= 0.1;
            trapWall.right.position.y -= 0.5;

            trapWall.dimension.y -= trapWall.startDim.y * 0.1;
        }
    }
}

function reducePlayerFar(player){
    var cam_far;

    if(player === 1){
        cam_far = secondCamera.far;
    }
    else if(player === 2){
        cam_far = primaryCamera.far;
    }

    if(cam_far > 6000){
        cam_far -= 20;
    }
    else if(cam_far > 3500){
        cam_far = 3500;
    }
    else{
        cam_far -= 10;
    }

    // assign cam to respective camera
    if(player === 1){
        secondCamera.far = cam_far;
        farItem.far = secondCamera.far;
    }
    else if(player === 2){
        primaryCamera.far = cam_far;
        farItem.far = primaryCamera.far;
    }
}

function createFreezeBall(player){
    var freezeBallInstance = new THREE.SphereGeometry(freezeBall.radius, 5, 5),
        freezeBallMaterial = new THREE.MeshLambertMaterial({
            color: freezeBall.color
        }),
    baskIceBall = new THREE.Mesh(freezeBallInstance, freezeBallMaterial);
    // set shadow
    baskIceBall.castShadow = true;
    baskIceBall.receiveShadow = true;

    scene.add(baskIceBall);

    if(player === 1){
        baskIceBall.position.x = paddle1.position.x;
        baskIceBall.position.z = paddle1.position.z-50;
        baskIceBall.position.y = paddle1.position.y;
    }
    else if(player === 2){
        baskIceBall.position.x = paddle2.position.x;
        baskIceBall.position.z = paddle2.position.z+50;
        baskIceBall.position.y = paddle2.position.y;
    }

    return baskIceBall;
}

function moveFreezeBall(player){
    var baskIceBall = freezeBall.instance;
    if(player === 1){
        baskIceBall.position.z -= 98;
    }
    else if(player === 2){
        baskIceBall.position.z += 98;
    }
}

function reset() {
    ball.position.set(0, 0, 0);
    ball.$velocity = null;
}

function generateRandomItem(){
    item = addItem();

    item.position.z = -1000 + Math.floor((Math.random() * 2000) + 1);
    item.position.x = -500 + Math.floor((Math.random() * 1000) + 1);
    item.position.y = 50;
    return item;
}

function generateTrapWall(pos){
    var wallImage = THREE.ImageUtils.loadTexture('images/wall.jpg');
    var wallMaterial = new THREE.MeshPhongMaterial({map: wallImage});
    var itemGeometry = new THREE.CubeGeometry(trapWall.startDim.x, trapWall.startDim.y, trapWall.startDim.z, 1, 1, 1),

        itemMaterial = new THREE.MeshLambertMaterial({
            color: trapWall.color
        }),
        wall = new THREE.Mesh(itemGeometry, wallMaterial);

    // adding wall to scene
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);

    // defining wall positions
    wall.position.y = -55;
    wall.position.z = 0;
    wall.position.x = pos;

    return wall;

}

function init() {
    container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    primaryCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    primaryCamera.position.set(0, cameraPosition.height.player1, FIELD_LENGTH / 2 + 500);

    secondCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    secondCamera.position.set(0, cameraPosition.height.player2, -(FIELD_LENGTH / 2 + 500));

    scene = new THREE.Scene();
    scene.add(primaryCamera);
    scene.add(secondCamera);

    // set paddles
    paddle1 = addPaddle(player_1_paddle.dimension,player_1_paddle.color);
    paddle1.position.z = FIELD_LENGTH / 2;
    paddle2 = addPaddle(player_2_paddle.dimension,player_2_paddle.color);
    paddle2.position.z = -FIELD_LENGTH / 2;

    // generate trapWall objects
    trapWall.left = generateTrapWall(-trapWall.width);
    trapWall.right = generateTrapWall(trapWall.width);

    var ballTexture = THREE.ImageUtils.loadTexture("images/ball.jpg");
    ballTexture.minFilter = THREE.LinearFilter;

    // set ball
    var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16),
        ballMaterial = new THREE.MeshLambertMaterial({
            map: ballTexture
        });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.receiveShadow = true;
    ball.castShadow = true;
    scene.add(ball);

    primaryCamera.lookAt(ball.position);
    secondCamera.lookAt(ball.position);

    // set light
    mainLight = new THREE.HemisphereLight(0xFFFFFF, 0x003300, 0.4);
    scene.add(mainLight);

    // set "sun"
    sunLight = new THREE.PointLight( 0xffffff, 1, 30000 );

    // set shadow
    sunLight.castShadow = true;
    sunLight.receiveShadow = false;

    //Set up shadow properties for the light
    sunLight.shadow.mapSize.width = 512;  // default
    sunLight.shadow.mapSize.height = 512; // default
    sunLight.shadow.camera.near = 0.5;       // default
    sunLight.shadow.camera.far = 9000;      // default

    sunLight.position.x = -2000;
    sunLight.position.y = 5000;
    sunLight.position.z = -1000;

    scene.add(sunLight);

    // sun helper
    var helper = new THREE.CameraHelper( sunLight.shadow.camera );
    scene.add( helper );

    var fieldGeometry = new THREE.CubeGeometry(FIELD_WIDTH, 5, FIELD_LENGTH, 1, 1, 1),
        textureImage = THREE.ImageUtils.loadTexture('images/football-field.jpg');
    var fieldMaterial = new THREE.MeshPhongMaterial({map: textureImage});
    field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.set(0, -20, 0);
    field.castShadow = true;
    field.receiveShadow = true;
    scene.add(field);

    var moonGeometry = new THREE.SphereGeometry(500, 32, 32);
    var moonTexture = THREE.ImageUtils.loadTexture('images/moon.jpg');
    var moonMaterial = new THREE.MeshLambertMaterial({ map: moonTexture  });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.receiveShadow = true;
    moon.castShadow = true;
    moveMoon();

    scene.add(moon);

    // set background
    var backgroundTexture = THREE.ImageUtils.loadTexture("images/background-universe.jpg");
    backgroundTexture.minFilter = THREE.LinearFilter;

    backgroundSphere = new THREE.Mesh(
      new THREE.SphereGeometry(FAR - 2500, 20, 20),
      new THREE.MeshBasicMaterial({
          map: backgroundTexture
      })
    );

    backgroundSphere.scale.x = -1;
    scene.add(backgroundSphere);

    updateScoreBoard();
    startRender();

    renderer.domElement.style.cursor = 'none';
}

function addPaddle(paddle_prop, color_paddle) {
    var paddleGeometry = new THREE.CubeGeometry(paddle_prop.x, paddle_prop.y, paddle_prop.z, 1, 1, 1),
        paddleMaterial = new THREE.MeshLambertMaterial({
            color: color_paddle
        }),
        paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle.receiveShadow = false;
    paddle.castShadow = true;
    scene.add(paddle);

    return paddle;
}

function addItem(){
    var itemImage = THREE.ImageUtils.loadTexture('images/box.jpg'),
        itemMaterial = new THREE.MeshPhongMaterial({map: itemImage}),
        itemGeometry = new THREE.CubeGeometry(fieldItem.dimension.x, fieldItem.dimension.y, fieldItem.dimension.z, 1, 1, 1),
        item = new THREE.Mesh(itemGeometry, itemMaterial);
    item.receiveShadow = false;
    item.castShadow = true;
    scene.add(item);

    return item;
}