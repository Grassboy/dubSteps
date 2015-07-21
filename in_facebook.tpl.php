<?
header('Access-Control-Allow-Origin: *');
?>
<div class="ds-container">
    <article class="ds-body">
        <div class="ds-logo"></div>
        <header class="ds-title">
            <h1>dubSteps 步步</h1>
            <h2>取得好友打卡資訊</h2>
        </header>
        <p class="ds-description">
            您可在這裡取得 Facebook 好友的打卡資訊，<br />
            並且整合成一個打卡記錄檔進行下載，<br />
            接著您可到<a href="http://grassboy.tw/dubSteps/" target="_blank">dubSteps 首頁</a>載入該檔案<br />
            就能在地圖上看到好友的打卡記錄囉~
        </p>
        <iframe class="ds-start" src="https://grassboy.github.io/fb_iframe.html"></iframe>
        <button class="ds-download">Download 下載資料</button>
        <button class="ds-retry">針對無法取得打卡記錄的朋友重試一次</button>
        <div class="ds-processing">
            <div class="ds-friend"><img src="//i.imgur.com/lnHRVZx.png" class="ds-thumb"></div>
        </div>
    </article>
</div>
