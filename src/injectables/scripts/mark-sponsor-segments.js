(async function() {
  const segments = window['yt++'].data.json('segments');
  const skipHotkey = window['yt++'].data.json('skipHotkey');
  const _mark = window['yt++'].data.bool('mark');
  const _autoSkip = window['yt++'].data.array('autoSkip');

  await window['yt++'].waitForOptional(() => window['yt++'].elements.player() != null);
  const player = window['yt++'].elements.player();

  function mark() {
    const duration = player.getDuration();

    const progressBarOverlay = document.createElement('div');
    progressBarOverlay.style.position = 'absolute';
    progressBarOverlay.style.width = '100%';
    progressBarOverlay.style.height = '100%';

    window['yt++'].elements.progressBarContainer().appendChild(progressBarOverlay);

    for (let s = 0; s < segments.length; ++s) {
      const segment = segments[s];

      const block = document.createElement('div');
      block.style.position = 'absolute';
      block.style.left = ((segment.start / duration) * 100 ) + '%';
      block.style.width = (((segment.end - segment.start) / duration) * 100) + '%';
      block.style.height = '100%';
      block.style.zIndex = 9999 + (segments.length - s);
      block.style.backgroundColor = {
        'sponsor':        '#8033FF',
        'selfpromo':      '#00FF00',
        'interaction':    '#FF5733',
        'intro':          '#33E9FF',
        'outro':          '#E6FF33',
        'preview':        '#FFA7FB',
        'music_offtopic': '#E8FFA7',
        'filler':         '#232AFF',
      }[segment.category] ?? '#F00';

      progressBarOverlay.appendChild(block);
    }

    const playerOverlay = document.createElement('div');
    playerOverlay.style.position = 'absolute';
    playerOverlay.style.width = '100%';
    playerOverlay.style.height = '100%';
    playerOverlay.style.zIndex = 9999;
    playerOverlay.style.pointerEvents = 'none';
    playerOverlay.style.display = 'none';
    player.appendChild(playerOverlay);

    const skipBtnContainer = document.createElement('span');
    skipBtnContainer.classList.add('ytp-ad-skip-button-container');

    const skipBtn = document.createElement('button');
    skipBtn.classList.add('ytp-ad-skip-button');
    skipBtn.classList.add('ytp-button');
    skipBtn.addEventListener('click', () => {
      const time = player.getCurrentTime();
      const segment = segments.find(x => x.start <= time && x.end > time);
      if (segment != null) { player.seekTo(segment.end); }
    });
    skipBtnContainer.appendChild(skipBtn);

    const text = document.createElement('div');
    text.innerText = 'Skip Sponsor Segment';
    skipBtn.appendChild(text);

    playerOverlay.appendChild(skipBtnContainer);

    window['yt++'].elements.video(player).addEventListener('timeupdate', () => {
      if (window['yt++'].adIsPlaying()) {
        progressBarOverlay.style.display = 'none';
        playerOverlay.style.display = 'none';
      } else {
        progressBarOverlay.style.display = 'flex';

        const time = player.getCurrentTime();
        const segment = segments.find(x => x.start <= time && x.end > time);
        playerOverlay.style.display = segment == null ? 'none' : null;
      }
    });

    window['yt++'].onHotkeyPressed(skipHotkey, () => skipBtn.click());
  }

  function autoSkip() {
    window['yt++'].elements.video(player).addEventListener('timeupdate', () => {
      if (window['yt++'].adIsPlaying()) {
        return;
      }

      const time = player.getCurrentTime();
      const segment = segments.find(x => x.start <= time && x.end > time);
      if (segment != null && _autoSkip.includes(segment.category)) {
        player.seekTo(segment.end); // This pauses the video for whatever reason
      }
    });
  }

  if (_mark) { mark(); }
  autoSkip();
}());