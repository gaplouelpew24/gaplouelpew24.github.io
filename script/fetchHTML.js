fetch('html/notice.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('Notice').innerHTML = html;
});

fetch('html/leftbar.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('LeftBar').innerHTML = html;
});

fetch('html/topbar.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('TopBar').innerHTML = html;
});

fetch('html/rightclickmenu.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('RightClickMenu').innerHTML = html;
});

fetch('html/maincontent/base.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CBase').innerHTML = html;
});

fetch('html/maincontent/search.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CSearch').innerHTML = html;
});

fetch('html/maincontent/explorer.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CExplorer').innerHTML = html;
});

fetch('html/maincontent/inventory.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CInventory').innerHTML = html;
});

fetch('html/maincontent/research.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CResearch').innerHTML = html;
});

fetch('html/maincontent/bag.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CBag').innerHTML = html;
});

fetch('html/maincontent/craft.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CCraft').innerHTML = html;
});


//在fetch完成之后再执行其他js文件
function loadScript(src) {
    return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function loadScriptsInOrder() {
    loadScript('script/variables.js')
        .then(function() {
            return loadScript('script/attackEntity.js');
        })
        .then(function() {
            return loadScript('script/basicContent.js');
        })
        .then(function() {
            return loadScript('script/gamePlay.js');
        })
        .then(function() {
            return loadScript('script/click.js');
        })
        .then(function() {
            return loadScript('script/update.js');
        })
        .then(function() {
            return loadScript('script/draggable.js');
        })
        .then(function() {
            document.getElementById('Loading').classList.add('hide');
        })
        .catch(function(error) {
            console.error('Error loading script: ', error);
        });
}