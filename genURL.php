<?
header('Access-Control-Allow-Origin: *');
if($_FILES['cached_file']) {
    $md5_key = md5(file_get_contents($_FILES['cached_file']['tmp_name']));
    copy($_FILES['cached_file']['tmp_name'], 'cached/'.$md5_key.'.json');
    echo json_encode(array('ok'=>true, 'rsp'=>$md5_key));
} else {
    echo json_encode(array('ok'=>false, 'msg'=>'傳進來的 Facebook 打卡資訊不存在'));
}
?>
