<?
	$_title = "【dubSteps 步步】看看朋友都去哪！";
	$_thumb = "http://i.imgur.com/sFdsTJS.png";
	$_thumb_large = "http://i.imgur.com/NgOHfaJ.png";
	$_description = "藉著 Facebook 好友們的打卡資訊，一起探索世界！";
	$_url = "http://grassboy.tw/dubSteps/";
	$_type = "website";
    $_share_plurk = $_url." (".$_title.")\r\n".$_thumb_large."\r\n".$_description;
    $_share_line = $_title."\r\n".$_url."\r\n".$_description."\r\n使用情境圖：".$_thumb_large;
?>
<!DOCTYPE HTML>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=0.85, user-scalable=0">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="description" content="<?=$_description?>" />
    <meta name="author" content="小胖子．吳草兒 Grassboy">
	<meta property="og:type" content="<?=$_type?>" />
	<meta property="og:title" content="<?=$_title?>" />
	<meta property="og:description" content="<?=$_description?>" />
	<meta property="og:url" content="<?=$_url?>" />
	<meta property="og:image" content="<?=$_thumb?>" />
	<meta property="og:site_name" content="<?=$_title?>" />
	<meta property="fb:admins" content="663898857" />
	<meta property="fb:app_id" content="1098678166826486" />

    <link rel="canonical" href="<?=$_url?>" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" type="text/javascript"></script>
	<script src="javascripts/cluster_init.js" type="text/javascript"></script>
	<script src="javascripts/qr.js" type="text/javascript"></script>
	<link href="stylesheets/screen.css" media="screen, projection" rel="stylesheet" type="text/css" />
	<link href="icomoon/style.css" rel="stylesheet" type="text/css" />
    <!--
	<script src="http://grassboy.tw:35729/livereload.js" type="text/javascript"></script>
	<link href="http://grassboy.tw:24680/stylesheets/screen.css" media="screen, projection" rel="stylesheet" type="text/css" />
    -->
	<title><?=$_title?></title>
</head>
<body>
    <div class="ds-top-header">
        <hgroup>
            <div class="ds-logo"></div>
            <h1>dubSteps 步步</h1>
            <h2>看看朋友都去哪！</h2>
        </hgroup>
        <ul class="ds-toolbar">
            <li class="ds-load-fb"><i class="icon-facebook"></i><label>下載 Facebook 資料</label></li>
            <li class="ds-import"><i class="icon-map"></i><label>載入打卡資訊</label></li>
            <li class="ds-export"><i class="icon-upload"></i><label>局部匯出至雲端</label></li>
            <li class="ds-help"><i class="icon-help"></i><label>關於</label></li>
        </ul>
    </div>
    <article class="ds-dialog ds-about">
        <h3 class="ds-about-title">關於【dubSteps 步步】</h3>
        <p class="ds-xd">(啊，偷徵一下女友好了XDD)</p>
        <p class="ds-about-text">
            這是一個可以將好友的打卡資訊，一次顯示於地圖上的網頁，是由 <a href="http://www.plurk.com/grassboy" target="_blank" class="ds-about-link">Grassboy (小胖子．吳草兒)</a> 所開發，由於不是使用正規 Facebook API... 所以不保證未來是否能永久正常運作(小聲)<br />
            初次使用請先 <button class="ds-about-fb-import"><i class="icon-facebook"></i>下載 Facebook 資料</button>
        </p>
        <section class="ds-about-logo"></section>
        <ul class="ds-about-share-list">
            <li class="ds-about-link-item"><a href="https://www.facebook.com/sharer/sharer.php?u=<?=urlencode($_url)?>" class="ds-about-link ds-facebook" target="_blank">分享到 Facebook</a></li>
            <li class="ds-about-link-item"><a href="http://www.plurk.com/?qualifier=shares&status=<?=urlencode($_share_plurk)?>" class="ds-about-link ds-plurk" target="_blank">分享到 Plurk</a></li>
            <li class="ds-about-link-item"><a href="line://msg/text/<?=urlencode($_share_line)?>" class="ds-about-link ds-line" target="_blank">分享到 Line</a></li>
        </ul>
        <ul class="ds-about-link-list">
            <li class="ds-about-link-item"><a href="http://www.ptt.cc/" class="ds-about-link" target="_blank">詳細介紹@Ptt</a></li>
            <li class="ds-about-link-item"><a href="http://www.plurk.com/" class="ds-about-link" target="_blank">相關討論@Plurk</a></li>
            <li class="ds-about-link-item"><a href="https://github.com/Grassboy/dubSteps" class="ds-about-link" target="_blank">專案原始碼@GitHub</a></li>
        </ul>
        <ul class="ds-about-ref-list">
            <li class="ds-about-link-item"><a href="http://neocotic.com/qr.js/" class="ds-about-link" target="_blank">QRCode: qr.js</a></li>
            <li class="ds-about-link-item"><a href="https://github.com/googlemaps/js-marker-clusterer" class="ds-about-link" target="_blank">MarkerCluster</a></li>
            <li class="ds-about-link-item"><a href="http://www.plurk.com/p/l3x1dj" class="ds-about-link" target="_blank">MarkerCluster (delegate version)</a></li>
            <li class="ds-about-link-item"><a href="https://gist.github.com/thiphariel/9951998" class="ds-about-link" target="_blank">Disable POI InfoWindow</a></li>
        </ul>
        <button class="ds-about-close"><i class="icon-close"></i></button>
    </article>
    <ul class="ds-scale-list">
        <li class="ds-scale-button"><a href="#" class="ds-scale-next"><i class="icon-arrow-up"></i></a></li>
        <li class="ds-scale-button"><a href="#" class="ds-scale-prev"><i class="icon-arrow-down"></i></a></li>
    </ul>
    <a href="#" class="ds-current-location"><i class="icon-gps-now"></i><label>目前位置</label></a>
    <div id="ds-map-container" data-tap-disabled="true" style="width: 100%; height: 100%; box-shadow: 0 0 10px gray inset;"></div>
    <div class="ds-drag-area"></div>
    <div class="ds-progress-bar">
        <div class="ds-progress-bar-inner"></div>
    </div>
    <div class="ds-upload-result ds-dialog">
        <h3 class="ds-upload-title">您選取的打卡資料已上傳至雲端</h3>
        <section class="ds-upload-section">
            您可透過手機掃描下列 QRCode 直接存取打卡資料<br />
            或是直接複製下列網址並開到新視窗
            <canvas class="ds-upload-canvas"></canvas>
            <input type="text" class="ds-upload-url" /><a href="#" class="ds-upload-link" target="_blank" title="直接前往"><i class="icon-link"></i></a
            ><button class="ds-upload-close"><i class="icon-close"></i></button>
        </section>
    </div>
    <div class="ds-fb-import ds-dialog">
        <ol class="ds-fb-step-list">
            <li class="ds-fb-step-item ds-active">
                <span class="ds-fb-step-title">下載 Facebook 資料</span>
                <div class="ds-fb-intro">
                    為了能夠在此頁顯示您 Facebook 朋友的打卡資料，
                    您需要至 Facebook 頁面將朋友打卡的資料複製下來，並載入此頁面
                    <em class="ds-fb-question">(問題：這樣會造成我的 Facebook 隱私外洩嗎？)</em>
                    <em class="ds-fb-answer">不會，複製出來的 Facebook 資料只會保存於您自己的電腦，而這個網頁在讀取的過程中，亦不會偷偷將您載入的檔案傳至網路上，所以可以放心~</em>
                </div>
                <span class="ds-fb-step-title">步驟一</span>
                點選 <a class="ds-fb-link" href="https://www.facebook.com/images/spacer.gif" target="_blank"><i class="icon-facebook2"></i>這個位於 facebook.com 連結</a>，將開出一個空白的新視窗<br /><br />

                若您先前已經從 Facebook 下載過打卡資訊了，那請直接 <button class="ds-fb-load-file-directly"><i class="icon-map"></i>載入打卡資訊</button>
            </li>
            <li class="ds-fb-step-item">
                <span class="ds-fb-step-title">步驟二</span>
                按下 F12 → 點進去 主控台/Console 分頁：如下圖<br />
                <img class="ds-fb-img ds-firefox-only" src="http://i.imgur.com/XTxxbJU.png" />
                <img class="ds-fb-img ds-chrome-only" src="http://i.imgur.com/XCLCiO5.png" />
            </li>
            <li class="ds-fb-step-item">
                <span class="ds-fb-step-title">步驟三</span>
                <textarea class="ds-fb-textarea"></textarea>
                回到此分頁，將右邊文字方塊內的程式碼全選→複製，貼到剛才的 主控台/Console 分頁，並按下 Enter 送出
                <em class="ds-fb-question">(問題：這個操作會造成我的資料外洩嗎？)</em>
                <em class="ds-fb-answer">
                    若是來源不明的程式碼，惡意的壞人的確可以透過這類操作偷取您的 Facebook 資訊，不過這個網頁提供的指令碼是完全公開的，不只小弟會幫您把關，網路上各大高手亦會協助大家把關的，所以請放心使用XD
                </em>
                <em class="ds-fb-warn ds-firefox-only">
                    在 Firefox 瀏覽器第一次貼上時，Console/主控台會出現詐騙警告…<br />
                    若您信得過小弟…可以直接輸入 allow pasting 按 Enter 再重新貼上指令，如下圖
                    <img class="ds-fb-img" src="http://i.imgur.com/hNHVWku.png" />
                </em>
            </li>
            <li class="ds-fb-step-item">
                <span class="ds-fb-step-title">步驟四</span>
                <img class="ds-fb-img" src="http://i.imgur.com/CorlqBz.png" />
                出現 dubStep 在 Facebook 讀取資料的畫面，如右圖，按下「開始讀取」就會開始囉~
            </li>
            <li class="ds-fb-step-item">
                <span class="ds-fb-step-title">步驟五</span>
                <img class="ds-fb-img" src="http://i.imgur.com/a7OjVoG.png" />
                根據您的 Facebook 好友數量多寡，會花上不同的處理時間 (估計四百個好友會花到十五分鐘) 等到處理完畢後，您的瀏覽器會下載一個檔名為 Facebook.data.txt 的打卡資訊
            </li>
            <li class="ds-fb-step-item">
                <span class="ds-fb-step-title">完工！</span>
                恭喜您，您已將朋友的打卡資訊備份至您的電腦裡了，您可選擇把那個檔案拖到下面的框框，或是按下面的「載入打卡資訊」朋友的打卡資訊就會顯示在畫面上囉~
                <div class="ds-fb-drop-area">
                    <button class="ds-fb-load-file">載入打卡資訊</button>
                    <input type="file" class="ds-import-file" accept="text/plain" />
                </div>
            </li>
        </ol>
        <button class="ds-fb-prev">上一步</button>
        <button class="ds-fb-next">下一步</button>
        <button class="ds-fb-close"><i class="icon-close"></i></button>
    </div>
    <iframe class="fb-like" src="https://www.facebook.com/v2.3/plugins/like.php?href=http%3A%2F%2Fgrassboy.tw%2FdubSteps%2F&layout=button_count&locale=zh_TW&share=false&show_faces=false"></iframe>
    <script src="javascripts/controller.js"></script>
</body>
</html>

