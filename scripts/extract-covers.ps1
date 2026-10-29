# Recreate the local teaching assets from the supplied reference. Windows only.
Add-Type -AssemblyName System.Drawing
$projectDirectory = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectDirectory 'reference/screenshots/1000017162.jpg'
$coverDirectory = Join-Path $projectDirectory 'assets/covers'
New-Item -ItemType Directory -Force -Path $coverDirectory | Out-Null
$sourceImage = [System.Drawing.Bitmap]::new($sourcePath)
$regions = @(
    @{ Name = 'regressor'; X = 28; Y = 768 },
    @{ Name = 'taxi'; X = 321; Y = 768 },
    @{ Name = 'yardman'; X = 614; Y = 768 },
    @{ Name = 'masquerade'; X = 28; Y = 1596 },
    @{ Name = 'tankman'; X = 321; Y = 1596 },
    @{ Name = 'rocker'; X = 614; Y = 1596 }
)
try {
    foreach ($region in $regions) {
        # Include the original exclusive badge, which extends left and below the cover.
        $rectangle = [System.Drawing.Rectangle]::new($region.X, $region.Y, 265, 374)
        $cover = $sourceImage.Clone($rectangle, $sourceImage.PixelFormat)
        try {
            $cover.Save((Join-Path $coverDirectory ($region.Name + '.jpg')), [System.Drawing.Imaging.ImageFormat]::Jpeg)
        } finally {
            $cover.Dispose()
        }
    }
} finally {
    $sourceImage.Dispose()
}
