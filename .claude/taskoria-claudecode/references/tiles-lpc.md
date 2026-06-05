# Tiles LPC-Quality — Listos para sprites.jsx

Inspirados en referencias LPC (Liberated Pixel Cup / RPG Maker estilo SNES).
Pegar las funciones en `sprites.jsx` y añadir al objeto `SPRITES`.

---

## Integración en 3 pasos

```js
// PASO 1: Pegar las funciones generate* ANTES del export SPRITES

// PASO 2: Añadir al export:
export const SPRITES = {
    cobblestone_tile: generateCobblestoneTile(), // mantener compatibilidad
    cobblestone_warm: generateCobblestoneWarm(), // nuevo (reemplaza visual)
    grass_dense:      generateGrassDense(),
    dungeon_stone:    generateDungeonStone(),
    wood_floor:       generateWoodFloor(),
    royal_stone:      generateRoyalStone(),
};

// PASO 3: Actualizar MapData.js
// townSquare:     tileSprite: 'cobblestone_warm', tileSize: 64
// mysticForest:   tileSprite: 'grass_dense',      tileSize: 64
// shadowCrypts:   tileSprite: 'dungeon_stone',     tileSize: 64
// tavernInterior: tileSprite: 'wood_floor',        tileSize: 64
// taskoriaKeep:   tileSprite: 'royal_stone',       tileSize: 64
```

---

## TILE 1: cobblestone_warm — Town Square
Adoquín beige/arena cálido. Referencia imagen 1 LPC.

```js
function generateCobblestoneWarm() {
    const S = 64;
    const buf = new Array(S * S).fill('#2a1f14');
    const tones = [
        {base:'#c8a87a',hi:'#e0c498',sh:'#9a7a52',sp:'#b89668'},
        {base:'#bfa06e',hi:'#d6b888',sh:'#8f7248',sp:'#ae8e60'},
        {base:'#d4b484',hi:'#ecca9e',sh:'#a4845c',sp:'#c2a070'},
        {base:'#c4a274',hi:'#dabb8e',sh:'#96764e',sp:'#b29064'},
        {base:'#ccac7c',hi:'#e4c496',sh:'#9e7e54',sp:'#ba9a6c'},
    ];
    const set = (x,y,c) => { if(x>=0&&x<S&&y>=0&&y<S) buf[y*S+x]=c; };
    const drawStone = (sx,sy,w,h,t) => {
        for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++) {
            if(dy===0||dy===h-1||dx===0||dx===w-1){set(sx+dx,sy+dy,'#2a1f14');continue;}
            if(dy===1||dx===1){set(sx+dx,sy+dy,t.hi);continue;}
            if(dy>=h-2||dx>=w-2){set(sx+dx,sy+dy,t.sh);continue;}
            const s=((sx+dx)*17+(sy+dy)*11+dx*dy)%19;
            set(sx+dx,sy+dy,s===0?t.sh:s===1?t.hi:s<4?t.sp:t.base);
        }
    };
    const pats=[{h:16,w:[20,22,22]},{h:16,w:[10,22,22,10]},{h:16,w:[22,20,22]},{h:16,w:[12,20,20,12]}];
    for(let row=0;row<4;row++){
        const pat=pats[row%pats.length]; let x=row%2===0?0:-8; const y=row*16;
        for(let s=0;s<pat.w.length;s++){drawStone(x,y,pat.w[s],pat.h,tones[(row+s*2+3)%tones.length]);x+=pat.w[s];}
    }
    return buf;
}
```

---

## TILE 2: grass_dense — Mystic Forest
Hierba densa con briznas y flores. Referencia imagen 3 LPC.

```js
function generateGrassDense() {
    const S = 64;
    const buf = new Array(S * S).fill('#3a7a28');
    const gt=['#3a7a28','#448c30','#327020','#4a9834','#50a838','#2e6820','#5ab040','#3c8028'];
    const set = (x,y,c) => { if(x>=0&&x<S&&y>=0&&y<S) buf[y*S+x]=c; };
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
        const s=(x*17+y*13+x*y*3+x*x*7)%31;
        set(x,y,gt[s%gt.length]);
    }
    // Briznas de hierba
    const blades=[];
    for(let r=0;r<8;r++) for(let i=0;i<10;i++) blades.push([i*6+r*2+1,r*8+4]);
    blades.forEach(([bx,by])=>{
        if(bx>=S||by>=S||by<2) return;
        const h=2+(bx*3+by*7)%3;
        for(let i=0;i<h;i++){if(by-i<0)break;set(bx,by-i,i===0?'#80d050':i===1?'#5ab040':'#3c8028');}
    });
    // Flores 3×3
    [[15,10,'#f8c8d0'],[38,22,'#f8f060'],[52,8,'#d8a8f0'],
     [8,36,'#f8e870'],[28,44,'#f8c0c8'],[48,30,'#c0f0a0'],
     [22,55,'#e0b8f0'],[42,58,'#f0f878']].forEach(([fx,fy,fc])=>{
        if(fx+2>=S||fy>=S) return;
        set(fx,fy,fc);set(fx+2,fy,fc);set(fx+1,fy>0?fy-1:fy,fc);
        set(fx+1,fy,'#f8e840');set(fx+1,fy+1<S?fy+1:fy,'#3c8028');
    });
    return buf;
}
```

---

## TILE 3: dungeon_stone — Shadow Crypts
Piedra oscura con grietas y humedad.

```js
function generateDungeonStone() {
    const S = 64;
    const buf = new Array(S * S).fill('#0e0e18');
    const tones=[
        {base:'#2a2a3e',hi:'#3e3e54',sh:'#16161e',sp:'#222232'},
        {base:'#262636',hi:'#3a3a50',sh:'#14141e',sp:'#1e1e2e'},
        {base:'#2e2e42',hi:'#42425a',sh:'#18182a',sp:'#262638'},
    ];
    const set=(x,y,c)=>{if(x>=0&&x<S&&y>=0&&y<S)buf[y*S+x]=c;};
    const drawStone=(sx,sy,w,h,t)=>{
        for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
            if(dy===0||dy===h-1||dx===0||dx===w-1){set(sx+dx,sy+dy,'#0e0e18');continue;}
            if(dy===1||dx===1){set(sx+dx,sy+dy,t.hi);continue;}
            if(dy>=h-2||dx>=w-2){set(sx+dx,sy+dy,t.sh);continue;}
            const s=((sx+dx)*11+(sy+dy)*7)%13;
            set(sx+dx,sy+dy,s<2?t.sh:s===2?t.sp:t.base);
        }
    };
    for(let row=0;row<4;row++){
        const off=(row%2)*16;const y=row*16;
        for(let col=-1;col<4;col++) drawStone(col*32+off,y,32,16,tones[(row+col+4)%tones.length]);
    }
    [[18,4,6,1,1],[44,22,5,-1,1],[8,38,4,1,1],[52,48,7,-1,1],[30,12,5,1,1]]
        .forEach(([x,y,len,dx,dy])=>{for(let i=0;i<len;i++){set(x+i*dx,y+i*dy,'#0a0a14');set(x+i*dx+1,y+i*dy,'#16162a');}});
    [[20,30],[50,14],[35,52],[10,50]]
        .forEach(([px,py])=>{for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) set(px+dx,py+dy,'#12122e');});
    return buf;
}
```

---

## TILE 4: wood_floor — Tavern Interior
Tablas horizontales de madera con veta y nudos.

```js
function generateWoodFloor() {
    const S = 64;
    const buf = new Array(S * S).fill('#2e1c0e');
    const tones=[
        {base:'#6b4423',hi:'#8a5c30',sh:'#4a2e14',v:'#5a3818',k:'#3e2410'},
        {base:'#7a4e28',hi:'#9a6838',sh:'#563618',v:'#6a421e',k:'#4a2e12'},
        {base:'#624020',hi:'#804e2a',sh:'#442c10',v:'#52341a',k:'#3a2010'},
        {base:'#724828',hi:'#905e34',sh:'#4e321a',v:'#60401e',k:'#442c14'},
        {base:'#6e4424',hi:'#8c5a30',sh:'#4c2e14',v:'#5c3a1a',k:'#403012'},
        {base:'#784e28',hi:'#966436',sh:'#543814',v:'#664218',k:'#483010'},
        {base:'#664028',hi:'#845030',sh:'#4a2c14',v:'#563618',k:'#3e2810'},
        {base:'#6c4620',hi:'#8a5c2e',sh:'#4e3010',v:'#5a3c1a',k:'#422c0e'},
    ];
    const H=8;const set=(x,y,c)=>{if(x>=0&&x<S&&y>=0&&y<S)buf[y*S+x]=c;};
    for(let row=0;row<8;row++){
        const t=tones[row];const ry=row*H;
        for(let dy=0;dy<H;dy++){
            const y=ry+dy;
            for(let x=0;x<S;x++){
                if(dy===0){set(x,y,'#1e1008');continue;}
                if(dy===H-1){set(x,y,'#261408');continue;}
                if(dy===1){set(x,y,t.hi);continue;}
                if(dy>=H-2){set(x,y,t.sh);continue;}
                const vs=(x*7+row*23+dy*3)%29;
                set(x,y,vs<2?t.v:t.base);
            }
        }
        if(row%3===1){const kx=(row*17+12)%50+7;const ky=ry+4;set(kx,ky,t.k);set(kx+1,ky,t.k);}
        (row%2===0?[20,44]:[12,36,58]).forEach(j=>{for(let dy=1;dy<H-1;dy++) set(j,ry+dy,'#2e1c0e');});
    }
    return buf;
}
```

---

## TILE 5: royal_stone — Taskoria Keep
Piedra gris-azulada con incrustaciones doradas.

```js
function generateRoyalStone() {
    const S = 64;
    const buf = new Array(S * S).fill('#1e1e2e');
    const tones=[
        {base:'#4a4862',hi:'#6a6882',sh:'#2e2c44',sp:'#3e3c54'},
        {base:'#424060',hi:'#62607c',sh:'#28283e',sp:'#383656'},
        {base:'#50506e',hi:'#707090',sh:'#343450',sp:'#424262'},
        {base:'#464464',hi:'#666280',sh:'#2c2c48',sp:'#3c3a58'},
    ];
    const set=(x,y,c)=>{if(x>=0&&x<S&&y>=0&&y<S)buf[y*S+x]=c;};
    const drawStone=(sx,sy,w,h,t)=>{
        for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
            if(dy===0||dy===h-1||dx===0||dx===w-1){set(sx+dx,sy+dy,'#1e1e2e');continue;}
            if(dy===1||dx===1){set(sx+dx,sy+dy,t.hi);continue;}
            if(dy>=h-2||dx>=w-2){set(sx+dx,sy+dy,t.sh);continue;}
            const s=((sx+dx)*19+(sy+dy)*13)%23;
            set(sx+dx,sy+dy,s<2?t.sh:s===2?t.sp:s===3?t.hi:t.base);
        }
    };
    const pats=[[32,32],[16,32,16],[32,32],[16,32,16]];
    for(let row=0;row<4;row++){
        const pat=pats[row];const y=row*16;let x=row%2===0?0:-16;
        for(let s=0;s<pat.length;s++){drawStone(x,y,pat[s],16,tones[(row+s*2+3)%tones.length]);x+=pat[s];}
    }
    [[16,0],[16,16],[16,32],[16,48],[32,8],[32,24],[32,40],[32,56],[48,0],[48,16],[48,32],[48,48]]
        .forEach(([gx,gy])=>{if(gx<S&&gy<S){set(gx,gy,'#c8a840');if(gx+1<S)set(gx+1,gy,'#a88830');}});
    return buf;
}
```
