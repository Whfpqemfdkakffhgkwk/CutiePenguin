var game;
var startPos = false;
var player;
var players;
var FirstPlayer;
var playerVelocity;
var platforms;
var cursors;
var scoreText;
var score = 0;
var livesText;
var lives = 3;
var playerCount = 0;
var isFirst = false;
var jumpPower = -700; // 점프 강도
var isFalling = false; // 플레이어가 현재 떨어지고 있는지 여부

var item;
var timeItem;
var itemCount = 0;
var itemTween;

var timer;
var timeLimit = 120; // 제한 시간 (초)
var progressBar;
var progressBarWidth = 320; // 게이지 슬라이더의 너비
var progressBarHeight = 35; // 게이지 슬라이더의 높이

function initGame() {
  game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container", {
    preload: preload,
    create: create,
    update: update,
  });
}

function preload() {
  // 게임 리소스 로드
  game.load.image("block", "./assets/sky.png");
  game.load.image("player", "./assets/peng.png");
  game.load.image("item", "./assets/item.png");
  game.load.image("timeItem", "./assets/timeItem.png");
  game.load.image("progressBar", "./assets/Gauge.png");
  game.load.image("progressbarBackground", "./assets/GaugeBackground.png");
}

function create() {
  //#region 게이지 관련
  progressBar = game.add.sprite(740, 400, "progressBar");
  progressBar.height = progressBarHeight;
  progressBar.width = progressBarWidth;
  // 게이지 슬라이더 스프라이트를 잘린 상태로 표시하기 위한 설정
  progressBar.cropEnabled = true;
  progressBar.cropRect = new Phaser.Rectangle(0, 0, 0, progressBarHeight);
  progressBar.angle = -90;
  //#endregion

  //#region 타이머 관련
  timer = game.time.create(); // 타이머를 생성하고 초기화
  timer.duration = 1200000;
  timer.add(Phaser.Timer.SECOND * timeLimit, timeUp, this);
  timer.start(); // 타이머를 시작합니다.
  //#endregion

  //#region 처음 펭귄 세팅
  FirstPlayer = game.add.sprite(338, 420, "player");
  game.physics.arcade.enable(FirstPlayer);
  FirstPlayer.body.gravity.y = 1000; // 중력 설정
  FirstPlayer.body.bounce.y = 0;
  FirstPlayer.scale.setTo(0.5, 0.5);
  //#endregion

  players = game.add.group();
  createPlayer(420);

  //#region 바닥 관련
  platforms = game.add.group();

  // 바닥 생성
  var ground = platforms.create(0, game.world.height - 64, "block");
  ground.scale.setTo(3, 1);
  game.physics.arcade.enable(platforms);
  ground.body.immovable = true;
  //#endregion

  //#region 텍스트 관련
  // 스코어 텍스트
  scoreText = game.add.text(15, 15, "Score: " + score, {
    fontSize: "32px",
    fill: "#8181F7",
  });

  //생명 텍스트
  livesText = game.add.text(700, 15, "Live: " + lives, {
    fontSize: "32px",
    fill: "#F4FA58",
  });
  //#endregion
  // 입력 처리
  cursors = game.input.keyboard.createCursorKeys();
}

function update() {
  // 남은 시간을 게이지 슬라이더에 반영
  var timePercentage = timer.duration / (Phaser.Timer.SECOND * timeLimit);
  updateProgressBar(timePercentage);

  //#region 클릭 전 계속 이동하는 부분
  if (player.canJump == true) {
    if (player.body.x <= 0) {
      // 왼쪽 끝에 도달하면 오른쪽으로 이동
      player.body.velocity.x = Math.abs(player.body.velocity.x);
    } else if (player.body.x + player.body.width >= game.world.width) {
      // 오른쪽 끝에 도달하면 왼쪽으로 이동
      player.body.velocity.x = -Math.abs(player.body.velocity.x);
    }
  }
  //#endregion

  if (player.body.velocity.y > 0) isFalling = true;

  game.physics.arcade.collide(FirstPlayer, platforms);

  if (itemCount >= 5) {
    itemCount = 0;
    ItemCreate();
  }
  playerVelocity = player.body.velocity.y;

  //#region 충돌처리 관련
  if (isFalling == true) {
    var player1 = players.children[playerCount];
    if (playerCount == 0) {
      game.physics.arcade.collide(
        FirstPlayer,
        player1,
        onCollision,
        null,
        this
      );
    } else {
      var player2 = players.children[playerCount - 1];
      game.physics.arcade.collide(player1, player2, onCollision2, null, this);
    }
  }

  game.physics.arcade.collide(player, timeItem, onCollisionItem, null, this);
  //#endregion

  //#region 게임오버 관련
  if (player.y >= game.world.height) {
    // 플레이어가 화면 아래로 떨어지면
    players.children.splice(playerCount, 1);
    if (lives > 0) lives--;
    isFalling = false;
    livesText.text = "Live: " + lives;

    if (lives <= 0) gameOver();
    else createPlayer(420);
  }
  //#endregion

  // 타이머 업데이트
  timer.update();
}

function jumpPlayer() {
  if (player.canJump) {
    player.canJump = false;
    player.body.velocity.y = jumpPower;
    player.body.velocity.x = 0;
    player.body.gravity.y = 1000; // 중력 설정
  }
}

function createPlayer(y) {
  if (startPos == true) {
    player = players.create(700, y, "player");
    startPos = false;
  } else {
    player = players.create(0, y, "player");
    startPos = true;
  }
  game.physics.arcade.enable(player);
  player.body.velocity.x = 200;
  player.body.gravity.y = 0;
  player.body.bounce.y = 0;
  player.scale.setTo(0.5, 0.5);

  // 클릭 이벤트 등록
  player.inputEnabled = true;
  player.events.onInputDown.add(jumpPlayer, this);

  // 점프가 끝났으니 움직임 활성화
  player.canJump = true;
}

function CollisionCommon(player1) {
  isFalling = false;

  game.physics.arcade.enable(player1);
  player1.body.gravity.y = 0;
  player1.body.velocity.y = 0;
  player1.body.bounce.y = 0;

  playerCount++;
  itemCount++;

  score += 100;
  scoreText.text = "Score: " + score;

  createPlayer(420);
}

function onCollision(FirstPlayer, player1) {
  FirstPlayer.body.gravity.y = 0;
  FirstPlayer.body.velocity.y = 0;
  FirstPlayer.body.bounce.y = 0;

  CollisionCommon(player1);
}

function onCollision2(player1, player2) {
  game.physics.arcade.enable(player2);
  player2.body.gravity.y = 0;
  player2.body.velocity.y = 0;
  player2.body.bounce.y = 0;

  FirstPlayer.y += 112;
  platforms.y += 112;
  for (let index = 0; index < players.length; index++) {
    players.getChildAt(index).y += 112;
  }

  CollisionCommon(player1);
}

function onCollisionItem(player, timeItem) {
  timeItem.destroy();
  player.body.velocity.y = playerVelocity;
  TimeItem();
}

function updateProgressBar(percentage) {
  progressBar.cropRect.width = progressBarWidth * percentage;
  progressBar.updateCrop();
}

function timeUp() {
  console.log("Time is up!");

  gameOver();
}

function TimeItem() {
  // 새로운 duration 값을 설정
  var BeforeDuration = timer.duration;
  var newDuration = BeforeDuration + 10000;

  if (newDuration > 120000) newDuration = 120000;

  timer.stop();
  timer.destroy();

  timer = game.time.create();
  timer.duration = newDuration;
  timer.add(Phaser.Timer.SECOND * (newDuration / 1000), timeUp, this);
  timer.start();

  console.log(newDuration);
}

function ItemCreate() {
  item = game.add.sprite(Math.floor(Math.random() * 600) + 50, 0, "item");
  game.physics.arcade.enable(item);
  item.anchor.setTo(0.5, 0);
  item.scale.setTo(0.5, 0.5);

  // Tween을 사용하여 아이템을 아래로 내려가게 함
  itemTween = game.add
    .tween(item)
    .to({ y: 35 }, 500, Phaser.Easing.Linear.None, true);

  // 아래로 내려온 후의 콜백 함수 설정
  itemTween.onComplete.add(function () {
    // 5초 후에 위로 올라가는 함수 호출
    game.time.events.add(Phaser.Timer.SECOND * 8, moveItemUp, this);
  }, this);

  item.inputEnabled = true;
  item.events.onInputDown.add(ItemClick, this);
}

function moveItemUp() {
  // Tween을 사용하여 아이템을 위로 올라가게 함
  itemTween = game.add
    .tween(item)
    .to({ y: 0 }, 500, Phaser.Easing.Linear.None, true);

  // 위로 올라간 후의 콜백 함수 설정
  itemTween.onComplete.add(function () {
    // 아이템을 사라지게 함
    item.destroy();
  }, this);
}

function ItemClick() {
  itemTween.stop();
  itemTween.onComplete = null;
  game.tweens.remove(itemTween);
  timeItem = game.add.sprite(item.x, item.y + 15, "timeItem");
  game.physics.arcade.enable(timeItem);
  timeItem.anchor.setTo(0.5, 0);
  timeItem.scale.setTo(0.2, 0.2);
  timeItem.body.gravity.y = 300;
  timeItem.body.bounce.y = 0;

  item.destroy();
}

function gameOver() {
  timer.stop();

  showResult();
}

function showResult() {
  var graphics = game.add.graphics();
  graphics.beginFill(0xffff99, 0.7); // 색상 및 투명도 설정
  graphics.drawRect(150, 150, 500, 300); // 박스의 위치 및 크기 설정
  graphics.endFill();

  // 결과창 텍스트
  var resultText = game.add.text(
    game.world.centerX,
    game.world.centerY - 50,
    "Your Score: " + score,
    {
      font: "32px Arial",
      fill: "#000000",
    }
  );
  resultText.anchor.setTo(0.5);

  // 다시하기 버튼
  var restartButton = game.add.text(
    game.world.centerX,
    game.world.centerY + 50,
    "Play Again",
    {
      font: "24px Arial",
      fill: "#000000",
    }
  );
  restartButton.anchor.setTo(0.5);
  restartButton.inputEnabled = true;

  // 다시하기 버튼을 클릭하면 재시작 함수 호출
  restartButton.events.onInputDown.add(restartGame, this);
}

function restartGame() {
  // 게임 상태 초기화 또는 필요한 동작 수행
  // 여기에 게임 초기화 관련 로직을 추가하세요.

  // 결과창의 요소들 제거
  game.world.removeAll();

  // 게임 다시 시작
  location.reload();
  initGame();
}
initGame();
