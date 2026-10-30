
(()=>{
 const video=document.getElementById('hero-film'),button=document.getElementById('hero-film-toggle');
 if(!video||!button)return;
 const ja=document.documentElement.lang.startsWith('ja'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,manualPause=false,userPlay=false,failed=false;
 const saveData=!!navigator.connection?.saveData;
 const sync=()=>{const paused=video.paused;button.textContent=failed?(ja?'動画を読み込めません':'Video unavailable'):paused?(ja?'▶ 動画を再生':'▶ Play video'):(ja?'Ⅱ 動画を一時停止':'Ⅱ Pause video');button.setAttribute('aria-label',button.textContent);button.setAttribute('aria-pressed',String(!paused));};
 const play=async()=>{if(failed)return;if(!video.getAttribute('src'))video.src=video.dataset.src;try{await video.play();}catch{sync();}};
 const update=()=>{if(!visible||document.hidden||manualPause||((reduce.matches||saveData)&&!userPlay))video.pause();else play();};
 button.hidden=false;button.addEventListener('click',()=>{if(video.paused){manualPause=false;userPlay=true;play();}else{manualPause=true;video.pause();}});
 video.addEventListener('play',sync);video.addEventListener('pause',sync);video.addEventListener('error',()=>{failed=true;button.disabled=true;sync();});
 document.addEventListener('visibilitychange',update);reduce.addEventListener('change',()=>{userPlay=false;update();sync();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.08}).observe(video);
 sync();update();
})();
