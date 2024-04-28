
//基础变量声明
let base, level, speed, exp, moneyneed, version, entity;
varibales();
//变量
function varibales() {
    base = {
        almondWater: 0,
        wanderer: 0,
        maxWanderer: 0,
        speed: 0,
    };

    level = {
        searchLevel: {
            almondWater: 1,
            maxAlmondWater: 0,
        },
        increaseLevel: {
            wanderer: 1,
            maxWanderer: 1,
        },
        managementLevel: {
            basement: 0,
            maxBasement: 0,
            explorer: 0,
            maxExplorer: 0,
        }
    };

    speed = {
        wandererSpeed: 0,
    };

    exp = {
        currentLevel: 0,
        currentExp: 0,
        maxExp: 0,
    };

    moneyneed = {
        upgrade: {
            search: {
                almondWater: 0,
            },
            increase: {
                wanderer: 0,
            },
            management: {
                basement: {
                    money: 0,
                    wanderer: 0,
                },
                explorer: {
                    money: 0,
                    level: 0,
                },
            },
        },
        buy: {
            wanderer: 0,
        }
    };
    
    entity = {
        level1: {
            hp: 0,
            maxHp: 0,
            exp: 0,
        },
    };
}