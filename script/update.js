//更新
function update(){
    level_and_speed();
    local_storage();
    player_level();
    money_need();
    upgrade_visiable();
    pressdown_display();

    if (x5) multiple_buy = 5;
    else if (x50) multiple_buy = 50;
    else multiple_buy = 1;
    

    //杏仁水获取速度
    base.speed = speed.wandererSpeed * 10;

    base.maxWanderer = moneyneed.upgrade.management.basement.wanderer;

    //游戏版本
    document.getElementById('GameVersion').textContent = version;

    //实体血条
    document.getElementById('Level1EntityHPBar').style.backgroundImage = "linear-gradient(to right,rgb(var(--red)) 0,rgb(var(--red)) "+ (entity.level1.hp / entity.level1.maxHp)*100 +"%,rgba(0,0,0,0) "+ (entity.level1.hp / entity.level1.maxHp)*100 +"%) ";

    exp.maxExp = Math.pow(exp.currentLevel, 1.5) * 100;
    expBar.style.setProperty('--expbar-startpoint', (exp.currentExp / exp.maxExp) * 100 + '%');

    display_values();
};

setInterval(update, 0);
setInterval(get_almondwater_exp, 10)