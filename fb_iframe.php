<?
	$_title = "dubStep 用來拿 accessToken 的頁面";
	$_thumb = "";
	$_description = "這支程式只是為了生支 accessToken 來抓朋友姓名的XD 什麼事都不會作~";
	$_url = "";
	$_type = "website";
    $_author = '小胖子．吳草兒 Grassboy';
	if(!$_url){
		$_url = sprintf("http://%s%s",$_SERVER["HTTP_HOST"], $_SERVER["PHP_SELF"]);
	}
?>
<!DOCTYPE HTML>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="description" content="<?=$_description?>" />
    <meta name="author" content="<?=$_author?>">
	<meta property="og:type" content="<?=$_type?>" />
	<meta property="og:title" content="<?=$_title?>" />
	<meta property="og:url" content="<?=$_url?>" />
	<meta property="og:image" content="<?=$_thumb?>" />
	<meta property="og:site_name" content="<?=$_title?>" />
	<meta property="fb:admins" content="663898857" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" type="text/javascript"></script>
	<title><?=$_title?></title>
</head>
<body>
<button style="display:none;">Start 開始讀取</button>
<script>
    window.fbAsyncInit = function() {
        FB.init({
            appId: '1098678166826486',
            xfbml: true,
            version: 'v2.4'
        });
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                var accessToken = response.authResponse.accessToken;
                $('button').show().click(function(){
                    window.parent.postMessage('{"accessToken":"'+accessToken+'"}', 'https://www.facebook.com');
                });
            } else {
                $('button').show().click(function(){
                    FB.login(function(response) {
                        if (response.authResponse) {
                            var accessToken = response.authResponse.accessToken;
                            window.parent.postMessage('{"accessToken":"'+accessToken+'"}', 'https://www.facebook.com');
                        } else {
                            alert('您必需要完成 Facebook 授權，才能使用 dubSteps !!');
                        }
                    });
                });
            }
        });
    };


    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
</script>
</body>
</html>

