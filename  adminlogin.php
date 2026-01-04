<section class="music-section" id="music">
    <h2 class="section-title">My Music</h2>
    
    <div class="song-list">
        <?php
        // Connect to database and get songs
        require_once 'config.php';
        $songs = $pdo->query("SELECT * FROM songs ORDER BY created_at DESC")->fetchAll();
        
        if (count($songs) > 0): 
            foreach ($songs as $song):
        ?>
        <div class="song-card">
            <h3><?php echo htmlspecialchars($song['title']); ?></h3>
            <p class="genre"><?php echo ucfirst($song['genre']); ?></p>
            <div class="song-stats">
                <span>Plays: <?php echo number_format($song['plays']); ?></span>
                <span>Downloads: <?php echo number_format($song['downloads']); ?></span>
            </div>
            <div class="song-controls">
                <button class="play-btn" data-file="<?php echo $song['file_path']; ?>">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="download-btn" 
                        data-id="<?php echo $song['id']; ?>" 
                        data-file="<?php echo $song['file_path']; ?>">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
        <?php 
            endforeach;
        else:
        ?>
        <div class="no-songs">
            <i class="fas fa-music"></i>
            <p>No songs available yet</p>
            <a href="admin/login.php" class="btn">Upload Songs</a>
        </div>
        <?php endif; ?>
    </div>
</section>
                <section class="video-section" id="videos">
    <h2 class="section-title">Music Videos</h2>
    
    <div class="video-gallery">
        <?php
        // Get videos from database
        $videos = $pdo->query("SELECT * FROM videos ORDER BY created_at DESC")->fetchAll();
        
        if (count($videos) > 0):
            foreach ($videos as $video):
        ?>
        <div class="video-card">
            <div class="video-thumbnail">
                <img src="<?php echo htmlspecialchars($video['thumbnail_url']); ?>" 
                     alt="<?php echo htmlspecialchars($video['title']); ?>">
                <div class="play-overlay" data-video="<?php echo $video['video_url']; ?>">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h3><?php echo htmlspecialchars($video['title']); ?></h3>
                <p><?php echo htmlspecialchars($video['description']); ?></p>
                <span class="views"><?php echo number_format($video['views']); ?> views</span>
            </div>
        </div>
        <?php 
            endforeach;
        else:
        ?>
        <div class="no-videos">
            <i class="fas fa-video"></i>
            <p>No videos available yet</p>
            <a href="admin/login.php" class="btn">Add Videos</a>
        </div>
        <?php endif; ?>
    </div>
</section>