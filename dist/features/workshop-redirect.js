const next=new URL('/control-center/',location.href);next.search=location.search;if(!next.searchParams.has('drill'))next.searchParams.set('section','drills');location.replace(next.href);
