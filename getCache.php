<?
header('Access-Control-Allow-Origin: *');
$file = $_GET['cached_file'];
if(!preg_match('/^[a-f0-9]{32}$/', $file)){
    $file = null;
}
if($file && file_exists('cached/'.$file.'.json')) {
    echo file_get_contents('cached/'.$file.'.json');
} else {
    echo json_encode(array());
}
?>
