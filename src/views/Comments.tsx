import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as I } from '../components/Icons';
import { u, accent, accentText } from '../tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import { Av, Cd } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Comment, Reply } from '../types';
import { fmtD, mention } from '../utils';
import { createComment as apiCreateComment, createReply as apiCreateReply, toggleCommentLike, toggleCommentResolve, toggleReplyLike } from '../services/api';

interface CommentsProps {
  eId: string;
  com: Comment[];
  setCom: React.Dispatch<React.SetStateAction<Comment[]>>;
  rep: Reply[];
  setRep: React.Dispatch<React.SetStateAction<Reply[]>>;
}

export default function Comments({ eId, com, setCom, rep, setRep }: CommentsProps) {
  const ME = useCurrentUser();
  const mob=useIsMobile();
  const[nc,setNc]=useState("");const[rt,setRt]=useState<string|null>(null);const[rtx,setRtx]=useState("");const[showRes,setShowRes]=useState(false);
  const ec=[...com.filter(c=>c.eId===eId)].sort((a,b)=>new Date(b.ts).getTime()-new Date(a.ts).getTime());
  const post=()=>{if(!nc.trim())return;setCom(p=>[...p,{id:`c${Date.now()}`,eId,author:ME,body:nc,ts:new Date().toISOString(),resolved:false,likes:[]}]);apiCreateComment({ programId: eId, body: nc }).catch(() => {});setNc("");};
  const postR=(cid: string)=>{if(!rtx.trim())return;setRep(p=>[...p,{id:`r${Date.now()}`,cId:cid,author:ME,body:rtx,ts:new Date().toISOString(),likes:[]}]);apiCreateReply({ commentId: cid, body: rtx }).catch(() => {});setRtx("");setRt(null);};
  const like=(t: string,id: string)=>{if(t==="c"){setCom(p=>p.map(c=>c.id===id?{...c,likes:c.likes.includes(ME.id)?c.likes.filter(l=>l!==ME.id):[...c.likes,ME.id]}:c));toggleCommentLike(id).catch(() => {});}else{setRep(p=>p.map(r=>r.id===id?{...r,likes:r.likes.includes(ME.id)?r.likes.filter(l=>l!==ME.id):[...r.likes,ME.id]}:r));toggleReplyLike(id).catch(() => {});}};
  const resolve=(id: string)=>{setCom(p=>p.map(c=>c.id===id?{...c,resolved:!c.resolved}:c));toggleCommentResolve(id).catch(() => {});};
  const vis=showRes?ec:ec.filter(c=>!c.resolved);const rc=ec.filter(c=>c.resolved).length;
  return(<Cd delay={.15} hover={false} className="p-4 md:p-5">
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2"><div className="flex items-center gap-2"><I name="chat" size={16} color="var(--foreground)"/><span className="text-sm font-bold text-foreground">Discussion</span><span className="text-xs text-muted-foreground">({ec.length})</span></div>{rc>0&&<button onClick={()=>setShowRes(!showRes)} className="text-xs font-bold px-3 py-1 rounded-lg bg-border text-secondary-foreground border-none cursor-pointer">{showRes?"Hide":"Show"} {rc} resolved</button>}</div>
    <div className="flex gap-3 mb-5"><Av user={ME} size={34}/><div className="flex-1 relative"><textarea value={nc} onChange={e=>setNc(e.target.value)} placeholder="Add a comment… @name to mention" className="w-full rounded-xl text-xs resize-none outline-none p-3 bg-muted border border-border text-foreground transition-colors focus:border-primary" rows={3}/><motion.button whileTap={{scale:.88}} onClick={post} disabled={!nc.trim()} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold" style={{background:nc.trim()?accent:'var(--border)',color:nc.trim()?accentText:'var(--muted-foreground)',opacity:nc.trim()?1:.5}}><I name="send" size={12} color={nc.trim()?accentText:'var(--muted-foreground)'}/>Post</motion.button></div></div>
    <div className="space-y-3"><AnimatePresence>{vis.map((c,i)=>{const cr=rep.filter(r=>r.cId===c.id);return(
      <motion.div key={c.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{delay:i*.04}} className="rounded-xl p-4 border border-border" style={{background:c.resolved?'hsla(var(--muted)/0.4)':'var(--muted)',opacity:c.resolved?.5:1}}>
        <div className="flex gap-3"><Av user={c.author} size={28}/><div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-foreground">{c.author.name}</span><span className="px-1.5 py-0.5 rounded text-[9px] bg-border text-muted-foreground">{c.author.role}</span><span className="text-xs ml-auto text-muted-foreground">{fmtD(c.ts)}</span></div>
          <p className="text-xs leading-relaxed mb-2.5 text-secondary-foreground">{mention(c.body)}</p>
          <div className="flex items-center gap-4">
            <button onClick={()=>like("c",c.id)} className="flex items-center gap-1.5 text-xs bg-transparent border-none cursor-pointer" style={{color:c.likes.includes(ME.id)?u.err:'var(--muted-foreground)'}}><I name="heart" size={13} color={c.likes.includes(ME.id)?u.err:'var(--muted-foreground)'}/>{c.likes.length>0&&c.likes.length}</button>
            <button onClick={()=>setRt(rt===c.id?null:c.id)} className="flex items-center gap-1.5 text-xs bg-transparent border-none cursor-pointer text-muted-foreground"><I name="reply" size={13} color="var(--muted-foreground)"/>Reply{cr.length>0&&` (${cr.length})`}</button>
            <button onClick={()=>resolve(c.id)} className="flex items-center gap-1.5 text-xs bg-transparent border-none cursor-pointer" style={{color:c.resolved?u.ok:'var(--muted-foreground)'}}><I name="check" size={13} color={c.resolved?u.ok:'var(--muted-foreground)'}/>{c.resolved?"Resolved":"Resolve"}</button>
          </div>
        </div></div>
        {cr.length>0&&<div className={`${mob?"ml-4":"ml-10"} mt-3 space-y-3`}>{cr.map(r=><div key={r.id} className="flex gap-2.5 pl-3 border-l-2 border-border"><Av user={r.author} size={mob?18:22}/><div className="flex-1"><div className="flex items-center gap-2 mb-0.5 flex-wrap"><span className="text-xs font-bold text-foreground">{r.author.name}</span><span className="text-xs text-muted-foreground">{fmtD(r.ts)}</span></div><p className="text-xs leading-relaxed text-secondary-foreground">{mention(r.body)}</p><button onClick={()=>like("r",r.id)} className="flex items-center gap-1 text-xs mt-1 bg-transparent border-none cursor-pointer" style={{color:r.likes.includes(ME.id)?u.err:'var(--muted-foreground)'}}><I name="heart" size={10} color={r.likes.includes(ME.id)?u.err:'var(--muted-foreground)'}/>{r.likes.length>0&&r.likes.length}</button></div></div>)}</div>}
        {rt===c.id&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} className={`${mob?"ml-4":"ml-10"} mt-3 flex gap-2`}><Av user={ME} size={mob?18:22}/><input value={rtx} onChange={e=>setRtx(e.target.value)} placeholder="Reply…" className="flex-1 text-xs rounded-lg outline-none px-3 py-2 bg-card border border-border text-foreground focus:border-primary" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();postR(c.id);}}} /><motion.button whileTap={{scale:.88}} onClick={()=>postR(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:accent,color:accentText}}><I name="send" size={11} color={accentText}/></motion.button></motion.div>}
      </motion.div>);})}</AnimatePresence></div>
  </Cd>);
}
