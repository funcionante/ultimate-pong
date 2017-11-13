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

        //get the scoreboard element.
        //scoreBoard = document.getElementById('scoreBoard'),
        player_1_score = document.getElementById('player_1_score'),
        player_2_score = document.getElementById('player_2_score'),

        //declare members.
        container, renderer, camera, mainLight, topCamera,
        scene, ball, paddle1, paddle2, item1, field, running,
        score = {
            player1: 0,
            player2: 0
        },
        PADDLE1DIMS = {z: 10, y: 30, x: 200},
        PADDLE2DIMS = {z: 10, y: 30, x: 200},
        TESTITEM = {z: 50, y: 50, x: 50};


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
        } else if (cpuPos.x - 100 < ballPos.x) {
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

        // IF HIT PADDLE 2
        if (ballObjectCollision(ball,paddle2,BALL_RADIUS,PADDLE2DIMS)){
            hitBallBack(paddle2);
        }

        // IF HIT ITEM
        if (ballObjectCollision(ball,item1,BALL_RADIUS,TESTITEM)){
            console.log("hit");
        }

        /*if (isPaddle1Collision()) {
            hitBallBack(paddle1);
        }*/

        /*if (isPaddle2Collision()) {
            hitBallBack(paddle2);
        }*/

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

    function isPastPaddle2() {
        return ball.position.z < paddle2.position.z - 100;
    }

    function updateBallPosition() {
        var ballPos = ball.position;

        //update the ball's position.
        ballPos.x += ball.$velocity.x;
        ballPos.z += ball.$velocity.z;

        // add an arc to the ball's flight. Comment this out for boring, flat pong.
        //ballPos.y = -((ballPos.z - 1) * (ballPos.z - 1) / 5000) + 435;
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

    /* TO DELETE
    function isPaddle2Collision() {
        return ball.position.z - BALL_RADIUS <= paddle2.position.z &&
            isBallAlignedWithPaddle(paddle2);
    }*/

    function ballObjectCollision(ball,object,ball_radius,object_dims){
        var collision = false;

        // x coordinate collision
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

            processBallMovement();
            //processCpuPaddle();
            paddleControl();
        }
    }

    function reset() {
        ball.position.set(0, 0, 0);
        ball.$velocity = null;
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
        item1 = addItem();
        item1.position.z = 0;
        item1.position.x = -100;

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
                color: 0xff0000
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