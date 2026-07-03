const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');

const target = `{/* 3D FLOATING IPHONE */}
        <FloatingPhone />
        
        {/* 3D GLASSMORPHISM MOCKUP (HIDDEN ON DESKTOP, OR REPLACED) */}
        <div className="hidden mt-16 w-full max-w-4xl relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">`;

const replacement = `<div className="mt-16 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-8 relative z-20">
          
          {/* 3D FLOATING IPHONE */}
          <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
            <FloatingPhone />
          </div>
          
          {/* 3D GLASSMORPHISM MOCKUP */}
          <div className="w-full lg:w-2/3 relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">`;

c = c.replace(target, replacement);

const targetClose = `</div>
        </div>
      </main>`;
const replacementClose = `</div>
          </div>
        </div>
      </main>`;

c = c.replace(targetClose, replacementClose);

fs.writeFileSync(p, c);
console.log('Fatto');
