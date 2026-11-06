import numpy as np
import wave
from pathlib import Path

# Original four-chord ambient cue: warm electric keys and a soft sustained pad.
sr=22050
seconds=24
mix=np.zeros((sr*seconds,2),dtype=np.float64)
def note(midi,start,duration,level,pan,pad=False):
    n=int(duration*sr); t=np.arange(n)/sr; f=440*2**((midi-69)/12)
    attack=.8 if pad else .025
    env=(1-np.exp(-t/attack))*np.exp(-t/(duration*.65 if pad else 1.4))
    env*=np.minimum(1,(duration-t)/.7)
    tone=np.sin(2*np.pi*f*t)+.20*np.sin(2*np.pi*2*f*t)*np.exp(-t/1.1)+.05*np.sin(2*np.pi*3*f*t)*np.exp(-t/.4)
    if pad: tone=.65*np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*1.0015*t)
    tone*=env*level
    offset=int(start*sr); end=min(len(mix),offset+n); tone=tone[:end-offset]
    mix[offset:end,0]+=tone*np.sqrt((1-pan)/2)
    mix[offset:end,1]+=tone*np.sqrt((1+pan)/2)
for i,chord in enumerate([[48,55,59,64,74],[45,52,55,60,71],[41,48,57,60,67],[43,50,57,60,67]]):
    for j,key in enumerate(chord):
        note(key,i*6,7,.045,(j-2)*.25,True)
        note(key+12,i*6+j*.15,4.8,.065,(j-2)*.2)
for key,start in [(76,2),(74,4),(71,8),(72,10),(69,14),(67,16),(69,20),(67,22)]:
    note(key,start,2.6,.035,.25)
for delay,gain in [(.19,.14),(.37,.10),(.61,.06)]:
    d=int(delay*sr); mix[d:]+=mix[:-d,::-1].copy()*gain
fade=np.minimum(1,np.arange(len(mix))/(sr*1.3))*np.minimum(1,(len(mix)-1-np.arange(len(mix)))/(sr*1.8))
mix*=fade[:,None]
mix*=.65/max(np.max(np.abs(mix)),.01)
out=Path(__file__).resolve().parents[1] / 'public/assets/via-nova-ambient.wav'
with wave.open(str(out),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((mix*32767).astype('<i2').tobytes())
print('Created original 24-second instrumental cue:',out.stat().st_size,'bytes')

