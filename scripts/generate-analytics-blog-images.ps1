Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot "public\images\blog"

function New-Color([int]$r, [int]$g, [int]$b, [int]$a = 255) {
  return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2

  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Fill-RoundedRect($graphics, $brush, [float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-RoundedRectPath $x $y $width $height $radius
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-RoundedRect($graphics, $pen, [float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-RoundedRectPath $x $y $width $height $radius
  $graphics.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-Glow($graphics, [float]$x, [float]$y, [float]$width, [float]$height, $color) {
  $brush = New-Object System.Drawing.SolidBrush $color
  $graphics.FillEllipse($brush, $x, $y, $width, $height)
  $brush.Dispose()
}

function Draw-TextBlock($graphics, [string]$text, $font, $brush, [float]$x, [float]$y, [float]$width, [float]$height, [string]$align = "Near") {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$align
  $format.LineAlignment = [System.Drawing.StringAlignment]::Near
  $graphics.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x, $y, $width, $height)), $format)
  $format.Dispose()
}

function Draw-Chip($graphics, [string]$text, [float]$x, [float]$y, [float]$width, $bgColor, $borderColor, $textBrush, $font) {
  $bgBrush = New-Object System.Drawing.SolidBrush $bgColor
  $pen = New-Object System.Drawing.Pen $borderColor, 1.5
  Fill-RoundedRect $graphics $bgBrush $x $y $width 36 18
  Draw-RoundedRect $graphics $pen $x $y $width 36 18
  Draw-TextBlock $graphics $text $font $textBrush ($x + 14) ($y + 8) ($width - 28) 24
  $bgBrush.Dispose()
  $pen.Dispose()
}

function New-Canvas {
  param(
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap 1600, 900
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  return [pscustomobject]@{
    Bitmap = $bitmap
    Graphics = $graphics
    Path = $Path
  }
}

function Save-Canvas($canvas) {
  $extension = [System.IO.Path]::GetExtension($canvas.Path).ToLowerInvariant()
  if ($extension -eq ".jpg" -or $extension -eq ".jpeg") {
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
      Where-Object { $_.MimeType -eq "image/jpeg" } |
      Select-Object -First 1
    $encoder = [System.Drawing.Imaging.Encoder]::Quality
    $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters 1
    $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]92)
    $canvas.Bitmap.Save($canvas.Path, $jpegCodec, $encoderParameters)
    $encoderParameters.Dispose()
  } else {
    $canvas.Bitmap.Save($canvas.Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function Draw-BaseBackground($graphics) {
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(1600, 900)),
    (New-Color 3 10 9),
    (New-Color 8 26 22)
  )
  $graphics.FillRectangle($background, 0, 0, 1600, 900)
  $background.Dispose()

  Draw-Glow $graphics -180 -120 760 760 (New-Color 16 185 129 40)
  Draw-Glow $graphics 1040 -140 620 620 (New-Color 38 244 199 22)
  Draw-Glow $graphics 820 520 520 320 (New-Color 16 185 129 20)
}

function Draw-Frame($graphics, [float]$x, [float]$y, [float]$width, [float]$height) {
  $brush = New-Object System.Drawing.SolidBrush (New-Color 5 18 15 218)
  $pen = New-Object System.Drawing.Pen (New-Color 110 231 183 90), 2
  Fill-RoundedRect $graphics $brush $x $y $width $height 28
  Draw-RoundedRect $graphics $pen $x $y $width $height 28
  $brush.Dispose()
  $pen.Dispose()
}

function Draw-CoverImage {
  $canvas = New-Canvas (Join-Path $outputDir "analytics-tracking-hero-generated.jpg")
  $g = $canvas.Graphics

  Draw-BaseBackground $g

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 40, [System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
  $chipFont = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
  $labelFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
  $whiteBrush = New-Object System.Drawing.SolidBrush (New-Color 245 252 249)
  $mutedBrush = New-Object System.Drawing.SolidBrush (New-Color 182 214 206)
  $accentBrush = New-Object System.Drawing.SolidBrush (New-Color 122 247 194)
  $linePen = New-Object System.Drawing.Pen (New-Color 110 231 183 90), 3

  Draw-TextBlock $g "TRACK WHAT CREATES LEADS" $titleFont $whiteBrush 110 120 560 140
  Draw-TextBlock $g "A clean analytics stack shows which pages, campaigns, buttons, and channels actually produce enquiries." $bodyFont $mutedBrush 110 270 520 130
  Draw-Chip $g "GA4 + Pixels + Clarity + Real Conversion Events" 110 388 420 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $accentBrush $chipFont

  Draw-Frame $g 720 120 700 520

  $screenBrush = New-Object System.Drawing.SolidBrush (New-Color 8 30 25 245)
  $screenPen = New-Object System.Drawing.Pen (New-Color 163 230 199 92), 2
  Fill-RoundedRect $g $screenBrush 805 210 530 340 22
  Draw-RoundedRect $g $screenPen 805 210 530 340 22

  $barBrush = New-Object System.Drawing.SolidBrush (New-Color 16 185 129 185)
  $barBrush2 = New-Object System.Drawing.SolidBrush (New-Color 88 246 215 165)
  $barBrush3 = New-Object System.Drawing.SolidBrush (New-Color 43 213 168 140)
  $gridPen = New-Object System.Drawing.Pen (New-Color 188 255 228 28), 1

  foreach ($offset in 0..4) {
    $y = 255 + ($offset * 48)
    $g.DrawLine($gridPen, 835, $y, 1305, $y)
  }

  $g.FillRectangle($barBrush, 860, 410, 54, 95)
  $g.FillRectangle($barBrush2, 938, 365, 54, 140)
  $g.FillRectangle($barBrush3, 1016, 320, 54, 185)
  $g.FillRectangle($barBrush, 1094, 280, 54, 225)
  $g.FillRectangle($barBrush2, 1172, 340, 54, 165)
  $g.FillRectangle($barBrush3, 1250, 300, 54, 205)

  $miniBrush = New-Object System.Drawing.SolidBrush (New-Color 10 39 32 220)
  Fill-RoundedRect $g $miniBrush 835 232 155 56 14
  Fill-RoundedRect $g $miniBrush 1007 232 135 56 14
  Fill-RoundedRect $g $miniBrush 1158 232 147 56 14
  Draw-TextBlock $g "Leads" $chipFont $accentBrush 852 250 80 26
  Draw-TextBlock $g "Top pages" $chipFont $accentBrush 1024 250 90 26
  Draw-TextBlock $g "ROAS" $chipFont $accentBrush 1175 250 80 26

  $cardBg = New-Object System.Drawing.SolidBrush (New-Color 6 24 20 232)
  $cardPen = New-Object System.Drawing.Pen (New-Color 122 247 194 75), 2

  Fill-RoundedRect $g $cardBg 720 170 160 84 18
  Draw-RoundedRect $g $cardPen 720 170 160 84 18
  Draw-TextBlock $g "GA4" $labelFont $whiteBrush 748 194 110 24

  Fill-RoundedRect $g $cardBg 1260 110 160 84 18
  Draw-RoundedRect $g $cardPen 1260 110 160 84 18
  Draw-TextBlock $g "Meta Pixel" $labelFont $whiteBrush 1286 134 110 24

  Fill-RoundedRect $g $cardBg 680 520 180 84 18
  Draw-RoundedRect $g $cardPen 680 520 180 84 18
  Draw-TextBlock $g "TikTok Pixel" $labelFont $whiteBrush 705 544 130 24

  Fill-RoundedRect $g $cardBg 1220 560 170 84 18
  Draw-RoundedRect $g $cardPen 1220 560 170 84 18
  Draw-TextBlock $g "Clarity" $labelFont $whiteBrush 1264 584 110 24

  $g.DrawLine($linePen, 880, 214, 900, 252)
  $g.DrawLine($linePen, 1260, 194, 1242, 232)
  $g.DrawLine($linePen, 860, 562, 892, 526)
  $g.DrawLine($linePen, 1220, 602, 1185, 550)

  Draw-Chip $g "Forms" 750 700 110 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $chipFont
  Draw-Chip $g "Calls" 878 700 100 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $chipFont
  Draw-Chip $g "WhatsApp" 995 700 132 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $chipFont
  Draw-Chip $g "Bookings" 1144 700 128 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $chipFont

  $screenBrush.Dispose()
  $screenPen.Dispose()
  $barBrush.Dispose()
  $barBrush2.Dispose()
  $barBrush3.Dispose()
  $gridPen.Dispose()
  $miniBrush.Dispose()
  $cardBg.Dispose()
  $cardPen.Dispose()
  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $accentBrush.Dispose()
  $linePen.Dispose()
  $titleFont.Dispose()
  $bodyFont.Dispose()
  $chipFont.Dispose()
  $labelFont.Dispose()

  Save-Canvas $canvas
}

function Draw-EventMapImage {
  $canvas = New-Canvas (Join-Path $outputDir "analytics-event-map-generated.jpg")
  $g = $canvas.Graphics

  Draw-BaseBackground $g

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
  $nodeFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
  $nodeSubFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
  $whiteBrush = New-Object System.Drawing.SolidBrush (New-Color 245 252 249)
  $mutedBrush = New-Object System.Drawing.SolidBrush (New-Color 182 214 206)
  $nodeBrush = New-Object System.Drawing.SolidBrush (New-Color 5 23 19 232)
  $nodePen = New-Object System.Drawing.Pen (New-Color 110 231 183 80), 2
  $linePen = New-Object System.Drawing.Pen (New-Color 122 247 194 110), 4
  $accentBrush = New-Object System.Drawing.SolidBrush (New-Color 122 247 194)

  Draw-TextBlock $g "THE 5 LEAD EVENTS TO TRACK" $titleFont $whiteBrush 100 80 1180 110
  Draw-TextBlock $g "Track the actions closest to real sales progress, then connect them to one clean reporting layer." $subFont $mutedBrush 100 192 620 70

  $nodes = @(
    @{ X = 120; Y = 290; Title = "Form submit"; Subtitle = "Confirmed enquiry only" },
    @{ X = 120; Y = 420; Title = "Phone tap"; Subtitle = "Mobile intent signal" },
    @{ X = 120; Y = 550; Title = "WhatsApp click"; Subtitle = "Direct sales path" },
    @{ X = 1020; Y = 340; Title = "Booking action"; Subtitle = "High buying intent" },
    @{ X = 1020; Y = 500; Title = "Thank-you confirm"; Subtitle = "Clean success state" }
  )

  foreach ($node in $nodes) {
    Fill-RoundedRect $g $nodeBrush $node.X $node.Y 300 88 20
    Draw-RoundedRect $g $nodePen $node.X $node.Y 300 88 20
    $accentNodeBrush = New-Object System.Drawing.SolidBrush (New-Color 16 185 129 205)
    $g.FillEllipse($accentNodeBrush, ($node.X + 20), ($node.Y + 24), 34, 34)
    $accentNodeBrush.Dispose()
    Draw-TextBlock $g $node.Title $nodeFont $whiteBrush ($node.X + 72) ($node.Y + 18) 190 24
    Draw-TextBlock $g $node.Subtitle $nodeSubFont $mutedBrush ($node.X + 72) ($node.Y + 45) 190 22
  }

  Draw-Frame $g 570 290 430 270
  $innerBrush = New-Object System.Drawing.SolidBrush (New-Color 6 29 23 240)
  Fill-RoundedRect $g $innerBrush 610 340 350 170 26
  $innerBrush.Dispose()

  Draw-TextBlock $g "Qualified lead layer" $nodeFont $whiteBrush 670 380 230 24 "Center"
  Draw-TextBlock $g "GA4 + Pixel events + CRM-ready attribution" $subFont $mutedBrush 645 420 280 48 "Center"
  Draw-Chip $g "Source quality" 655 470 130 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $accentBrush $nodeSubFont
  Draw-Chip $g "Landing page" 798 470 130 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $accentBrush $nodeSubFont

  $g.DrawLine($linePen, 420, 334, 570, 374)
  $g.DrawLine($linePen, 420, 464, 570, 424)
  $g.DrawLine($linePen, 420, 594, 570, 474)
  $g.DrawLine($linePen, 1020, 384, 1000, 394)
  $g.DrawLine($linePen, 1020, 544, 1000, 454)

  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $nodeBrush.Dispose()
  $nodePen.Dispose()
  $linePen.Dispose()
  $accentBrush.Dispose()
  $titleFont.Dispose()
  $subFont.Dispose()
  $nodeFont.Dispose()
  $nodeSubFont.Dispose()

  Save-Canvas $canvas
}

function Draw-DashboardImage {
  $canvas = New-Canvas (Join-Path $outputDir "analytics-dashboard-generated.jpg")
  $g = $canvas.Graphics

  Draw-BaseBackground $g

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
  $cardTitle = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
  $metricFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
  $whiteBrush = New-Object System.Drawing.SolidBrush (New-Color 245 252 249)
  $mutedBrush = New-Object System.Drawing.SolidBrush (New-Color 182 214 206)
  $panelBrush = New-Object System.Drawing.SolidBrush (New-Color 5 22 18 230)
  $panelPen = New-Object System.Drawing.Pen (New-Color 110 231 183 78), 2
  $accentBrush = New-Object System.Drawing.SolidBrush (New-Color 122 247 194)
  $barBrush = New-Object System.Drawing.SolidBrush (New-Color 16 185 129 190)
  $barBrush2 = New-Object System.Drawing.SolidBrush (New-Color 88 246 215 155)

  Draw-TextBlock $g "THE WEEKLY DASHBOARD THAT MATTERS" $titleFont $whiteBrush 100 80 1280 110
  Draw-TextBlock $g "Show source quality, landing page performance, lead actions, and a short decision summary. That is enough to move fast." $subFont $mutedBrush 100 192 700 64

  Draw-Frame $g 90 250 1420 560

  $cards = @(
    @{ X = 130; Y = 290; W = 300; H = 150; Title = "Lead total"; Metric = "37"; Foot = "Last 7 days" },
    @{ X = 455; Y = 290; W = 300; H = 150; Title = "Best source"; Metric = "Organic"; Foot = "12 conversions" },
    @{ X = 780; Y = 290; W = 300; H = 150; Title = "Top CTA"; Metric = "WhatsApp"; Foot = "9 high-intent clicks" },
    @{ X = 1105; Y = 290; W = 365; H = 150; Title = "Decision"; Metric = "Fix mobile form"; Foot = "Drop-off spike on landing page" }
  )

  foreach ($card in $cards) {
    Fill-RoundedRect $g $panelBrush $card.X $card.Y $card.W $card.H 24
    Draw-RoundedRect $g $panelPen $card.X $card.Y $card.W $card.H 24
    Draw-TextBlock $g $card.Title $cardTitle $mutedBrush ($card.X + 24) ($card.Y + 24) ($card.W - 48) 22
    Draw-TextBlock $g $card.Metric $metricFont $whiteBrush ($card.X + 24) ($card.Y + 60) ($card.W - 48) 42
    Draw-TextBlock $g $card.Foot $smallFont $accentBrush ($card.X + 24) ($card.Y + 112) ($card.W - 48) 20
  }

  Fill-RoundedRect $g $panelBrush 130 470 520 290 24
  Draw-RoundedRect $g $panelPen 130 470 520 290 24
  Draw-TextBlock $g "Source quality" $cardTitle $whiteBrush 156 494 220 24
  Draw-TextBlock $g "Organic, paid, direct, referral" $smallFont $mutedBrush 156 522 260 22

  foreach ($row in 0..3) {
    $y = 560 + ($row * 42)
    $g.FillRectangle($barBrush, 188, $y, (160 + ($row * 56)), 24)
    $label = @("Organic", "Meta Ads", "Direct", "Referral")[$row]
    Draw-TextBlock $g $label $smallFont $mutedBrush 156 ($y + 3) 120 20
  }

  Fill-RoundedRect $g $panelBrush 680 470 390 290 24
  Draw-RoundedRect $g $panelPen 680 470 390 290 24
  Draw-TextBlock $g "Landing pages" $cardTitle $whiteBrush 706 494 180 24
  Draw-TextBlock $g "/website-redesign-lagos" $smallFont $mutedBrush 706 548 220 22
  Draw-TextBlock $g "/services/landing-page-design" $smallFont $mutedBrush 706 590 250 22
  Draw-TextBlock $g "/launch" $smallFont $mutedBrush 706 632 150 22
  $g.FillRectangle($barBrush2, 915, 548, 110, 18)
  $g.FillRectangle($barBrush, 915, 590, 84, 18)
  $g.FillRectangle($barBrush2, 915, 632, 62, 18)

  Fill-RoundedRect $g $panelBrush 1100 470 370 290 24
  Draw-RoundedRect $g $panelPen 1100 470 370 290 24
  Draw-TextBlock $g "Conversion events" $cardTitle $whiteBrush 1126 494 180 24
  Draw-Chip $g "Forms 14" 1126 544 110 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $smallFont
  Draw-Chip $g "Calls 6" 1246 544 100 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $smallFont
  Draw-Chip $g "WhatsApp 9" 1126 594 130 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $smallFont
  Draw-Chip $g "Bookings 8" 1268 594 118 (New-Color 4 24 19 214) (New-Color 110 231 183 85) $whiteBrush $smallFont
  Draw-TextBlock $g "Weekly summary: traffic rose, but mobile form friction is cutting conversion efficiency." $smallFont $mutedBrush 1126 652 300 52

  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $panelBrush.Dispose()
  $panelPen.Dispose()
  $accentBrush.Dispose()
  $barBrush.Dispose()
  $barBrush2.Dispose()
  $titleFont.Dispose()
  $subFont.Dispose()
  $cardTitle.Dispose()
  $metricFont.Dispose()
  $smallFont.Dispose()

  Save-Canvas $canvas
}

Draw-CoverImage
Draw-EventMapImage
Draw-DashboardImage
