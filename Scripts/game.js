console.clear();

(function(window, document, THREE) {
    // "constants"...
    var WIDTH = 700,
        HEIGHT = 500,
        VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000,
        FIELD_WIDTH = 1200,
        FIELD_LENGTH = 3000,
        BALL_RADIUS = 20,
        BALL_JUMP_POSITION = 0,

        //get the scoreboard element.
        //scoreBoard = document.getElementById('scoreBoard'),
        player_1_score = document.getElementById('player_1_score'),
        player_2_score = document.getElementById('player_2_score'),

        //playerPower
        player_1_power = document.getElementById('player_1_power'),
        player_2_power = document.getElementById('player_2_power'),

        //declare members.
        container, renderer, camera, mainLight, topCamera,
        scene, ball, paddle1, paddle2, field, running,
        score = {
            player1: 0,
            player2: 0
        },
        PADDLE1DIMS = {z: 10, y: 30, x: 200},
        PADDLE2DIMS = {z: 10, y: 30, x: 200},
        trapWall = {startDim: {x: 50, y: 10, z: 50}, dimension: {x: 0, y: 0, z: 50}},
        player1Item = "none",
        player2Item = "none",
        fieldItem = {name: "", instance: "", dimension: {x: 50, y: 50, z: 50}},
        itemDirection = 1;


    function startBallMovement() {
        var direction = Math.random() > 0.5 ? -1 : 1;
        ball.$velocity = {
            x: 0,
            z: direction * 20
        };
        ball.$stopped = false;
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

        if (isSideCollision()) {
            ball.$velocity.x *= -1;
        }

        // IF HIT PADDLE 1
        if (ballObjectCollision(ball,paddle1,BALL_RADIUS,PADDLE1DIMS)){
            hitBallBack(paddle1);
        }

        // if hit the left wall
        if (ballObjectCollision(ball,trapWall.left,BALL_RADIUS,trapWall.dimension)){
            hitBallBackWall(trapWall.left);
        }

        // if hit the right wall
        if (ballObjectCollision(ball,trapWall.right,BALL_RADIUS,trapWall.dimension)){
            hitBallBackWall(trapWall.right);
        }

        // IF HIT PADDLE 2
        if (ballObjectCollision(ball,paddle2,BALL_RADIUS,PADDLE2DIMS)){
            hitBallBack(paddle2);
        }

        // if item exists, rotate
        if(fieldItem.instance !== ""){
            fieldItem.instance.rotation.y += 0.1;

            if (fieldItem.instance.position.y >= 20){
                itemDirection = -1;
            }
            else if(fieldItem.instance.position.y <= 0){
                itemDirection = 1;
            }

            fieldItem.instance.position.y += itemDirection;

            // if hit the item, gain power
            if (ballObjectCollision(ball,fieldItem.instance,BALL_RADIUS,fieldItem.dimension)){
                console.log("item");
                if(ball.$velocity.z < 0){
                    console.log("Player 1 power!");
                    gainPower(fieldItem.name,1);
                }
                else{
                    console.log("Player 2 power!");
                    gainPower(fieldItem.name,2);
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
            player_1_power.innerHTML ='<img src="https://image.freepik.com/free-icon/feet-kicking-a-soccer-ball_318-27303.jpg" height="40px" width="40px">';
        }
        else if(playerNumber === 2){
            player2Item = itemName;
            player_2_power.innerHTML ='<img src="https://image.freepik.com/free-icon/feet-kicking-a-soccer-ball_318-27303.jpg" height="40px" width="40px">';
        }
    }

    function loosePower(playerNumber){
        if(playerNumber === 1){
            player1Item = "none";
            player_1_power.innerHTML ='<img src="https://i.ytimg.com/vi/J3pF2jkQ4vc/maxresdefault.jpg" height="40px" width="40px">';
        }
        else if(playerNumber === 2){
            player2Item = "none";
            player_2_power.innerHTML ='<img src="https://i.ytimg.com/vi/J3pF2jkQ4vc/maxresdefault.jpg" height="40px" width="40px">';
        }
    }

    function isPastPaddle2() {
        return ball.position.z < paddle2.position.z - 100;
    }

    function updateBallPosition() {
        var ballPos = ball.position;

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
        return ballX - BALL_RADIUS < -halfFieldWidth || ballX + BALL_RADIUS > halfFieldWidth;
    }

    function hitBallBack(paddle) {
        ball.$velocity.x = (ball.position.x - paddle.position.x) / 5;
        ball.$velocity.z *= -1;
    }

    // TODO: improve bounce algorithm
    function hitBallBackWall(paddle) {
        ball.$velocity.x = (ball.position.x - paddle.position.x) / 10;
        ball.$velocity.z *= -1;
    }

    function ballObjectCollision(ball,object,ball_radius,object_dims){
        var collision = false;

        // x coordinate collision1
        var object_left_x_limit = object.position.x - object_dims.x / 2,
            object_right_x_limit = object.position.x + object_dims.x / 2,
            ball_left_x_limit = ball.position.x - ball_radius,
            ball_right_x_limit = ball.position.x + ball_radius;

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
            ball_left_y_limit = ball.position.y - ball_radius,
            ball_right_y_limit = ball.position.y + ball_radius;

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
            ball_left_z_limit = ball.position.z - ball_radius,
            ball_right_z_limit = ball.position.z + ball_radius;

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
        console.log(score);
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
        if(Key.isDown(65) && paddle1.position.x > -500){
            paddle1.position.x -= 10;
        }
        // player 1 go right
        if(Key.isDown(68) && paddle1.position.x < 500){
            paddle1.position.x += 10;
        }

        // player 2 go left
        if(Key.isDown(37) && paddle2.position.x < 500){
            paddle2.position.x += 10;
        }
        // player 2 go right
        if(Key.isDown(39) && paddle2.position.x > -500){
            paddle2.position.x -= 10;
        }

        // player 1 special power
        if(Key.isDown(32)){
            switch (player1Item){
                case "jump":
                    ballJump(ball);
                    loosePower(1);
            }
        }

        // player 2 special power
        if(Key.isDown(190)){
            switch (player2Item){
                case "jump":
                    ballJump(ball);
                    loosePower(2);
            }
        }

        // camera tracking
        topCamera.position.x = paddle2.position.x;
        camera.position.x = paddle1.position.x;
    }

    function render() {
        var SCREEN_W = 700;
        var SCREEN_H = 500;

        var left, bottom, width, height;

        left = 1;
        bottom = 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true);
        topCamera.aspect = width / height;
        topCamera.updateProjectionMatrix();
        renderer.render(scene, topCamera);

        left = 1;
        bottom = 0.5 * SCREEN_H + 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true); // clip out "viewport"
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        if (running) {

            requestAnimationFrame(render);

            // wall gaining height
            if(trapWall.left.position.y < 100){
                trapWall.left.scale.y += 0.1;
                trapWall.left.position.y += 0.5;
                trapWall.dimension.y += trapWall.startDim.y * 0.1;
            }

            if(trapWall.right.position.y < 100){
                trapWall.right.scale.y += 0.1;
                trapWall.right.position.y += 0.55;
            }

            if(trapWall.left.position.y >= 100 && trapWall.right.position.y >= 100){
                // wall joining
                if(trapWall.left.position.x <= -300){
                    trapWall.left.scale.x += 0.03;
                    trapWall.left.position.x += 0.75;
                    trapWall.dimension.x += trapWall.startDim.x * 0.03;
                }

                if(trapWall.right.position.x >= 300){
                    trapWall.right.scale.x += 0.03;
                    trapWall.right.position.x -= 0.75;
                }

                // wall advances on target
                if(trapWall.left.position.x >= -300 && trapWall.right.position.x <= 300){
                    trapWall.left.position.z += 1;
                    trapWall.right.position.z += 1;
                }
            }

            processBallMovement();
            processCpuPaddle();
            paddleControl();
        }
    }

    function reset() {
        ball.position.set(0, 0, 0);
        ball.$velocity = null;
    }

    function generateRandomItem(){
        item = addItem();
        item.position.z = 0;
        item.position.x = 0;
        return item;
    }

    function generateTrapWall(pos){
        var itemGeometry = new THREE.CubeGeometry(trapWall.startDim.x, trapWall.startDim.y, trapWall.startDim.z, 1, 1, 1),
            itemMaterial = new THREE.MeshLambertMaterial({
                color: 0xFF0000
            }),
            wall = new THREE.Mesh(itemGeometry, itemMaterial);

        // adding wall to scene
        scene.add(wall);

        // defining wall positions
        wall.position.y = -55;
        wall.position.z = 0;
        wall.position.x = pos;

        return wall;

    }

    function init() {
        container = document.getElementById('container');

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(WIDTH, HEIGHT);
        renderer.setClearColor(0x000000, 1);
        container.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(0, 200, FIELD_LENGTH / 2 + 500);

        topCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        topCamera.position.set(0, 200, -(FIELD_LENGTH / 2 + 500));

        scene = new THREE.Scene();
        scene.add(camera);

        var fieldGeometry = new THREE.CubeGeometry(FIELD_WIDTH, 5, FIELD_LENGTH, 1, 1, 1),
        textureImage = THREE.ImageUtils.loadTexture('https://upload.wikimedia.org/wikipedia/commons/8/8c/Football_field.jpg');
        var fieldMaterial = new THREE.MeshPhongMaterial({map: textureImage});
            /*fieldMaterial = new THREE.MeshLambertMaterial({
                color: 0x0033FF
            });*/
        field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.set(0, -50, 0);

        scene.add(field);
        paddle1 = addPaddle(PADDLE1DIMS,0xAA3333);
        paddle1.position.z = FIELD_LENGTH / 2;
        paddle2 = addPaddle(PADDLE2DIMS,0x3F51B5);
        paddle2.position.z = -FIELD_LENGTH / 2;

        trapWall.left = generateTrapWall(-550);
        trapWall.right = generateTrapWall(550);

        fieldItem.name = "jump";
        fieldItem.instance = generateRandomItem();

        var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16),
            ballMaterial = new THREE.MeshLambertMaterial({
                color: 0x0FF0FF
            });
        ball = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ball);

        camera.lookAt(ball.position);
        topCamera.lookAt(ball.position);

        mainLight = new THREE.HemisphereLight(0xFFFFFF, 0x003300);
        scene.add(mainLight);

        camera.lookAt(ball.position);
        topCamera.lookAt(ball.position);

        updateScoreBoard();
        startRender();

        //renderer.domElement.addEventListener('mousemove', containerMouseMove);
        renderer.domElement.style.cursor = 'none';
    }

    function addPaddle(paddle_prop, color_paddle) {
        var paddleGeometry = new THREE.CubeGeometry(paddle_prop.x, paddle_prop.y, paddle_prop.z, 1, 1, 1),
            paddleMaterial = new THREE.MeshLambertMaterial({
                color: color_paddle
            }),
            paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
        scene.add(paddle);

        return paddle;
    }

    function addItem(){
        var itemGeometry = new THREE.CubeGeometry(50, 50, 50, 1, 1, 1),
            itemMaterial = new THREE.MeshLambertMaterial({
                color: 0xFF0000
            }),
            item = new THREE.Mesh(itemGeometry, itemMaterial);
        scene.add(item);

        return item;
    }

    /*function containerMouseMove(e) {
        var mouseX = e.clientX;
        camera.position.x = paddle1.position.x = -((WIDTH - mouseX) / WIDTH * FIELD_WIDTH) + (FIELD_WIDTH / 2);
        topCamera.position.x = paddle2.position.x;
    }*/

    init();
})(window, window.document, window.THREE);