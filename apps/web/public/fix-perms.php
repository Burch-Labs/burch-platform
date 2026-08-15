<?php
// Auto-fix file permissions
$files = [
    'index.html'
];

$results = [];
foreach ($files as $file) {
    if (file_exists($file)) {
        $result = @chmod($file, 0644);
        $results[$file] = $result ? 'fixed' : 'failed';
    } else {
        $results[$file] = 'not found';
    }
}

// Also fix directory permissions
@chmod('.', 0755);

header('Content-Type: text/plain');
echo "Permission Fix Results:\n";
echo "======================\n";
foreach ($results as $file => $status) {
    echo "$file: $status\n";
}
echo "\nIf all show 'fixed', the website should now be accessible.\n";
echo "You can delete this file after confirming the website works.\n";
?>
