import { useMemo, useState } from 'react';
import { PageHero } from '../components/common/AdminCommon';
import { AdminButton, AdminCheckbox, AdminSelect, AdminTextArea, AdminTextBox, AdminToolbar } from '../components/common/AdminControls';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../lib/api/apiClient';
import { appConfig } from '../lib/config';

type Form = Record<string, string>;
type Field = { key: string; label: string; type?: string; upload?: boolean; placeholder?: string; control?: 'checkbox'|'textarea'|'select'|'theme'|'style'; options?: string[]; span2?: boolean };

type ThemeOption = { id:string; name:string; description:string; colors:string[]; dark?:boolean };

type StyleOption = { id:string; name:string; description:string; density:string; layout:'grid'|'dense'|'commerce'|'portal'|'minimal'|'property'|'auto'|'luxury' };
const styles: StyleOption[] = [
  {id:'modern',name:'Modern',description:'Balanced cards, spacious hero and clean navigation.',density:'Comfortable',layout:'grid'},
  {id:'marketplace',name:'Marketplace',description:'Dense listing grid with fast browsing and filters.',density:'Compact',layout:'dense'},
  {id:'ecommerce',name:'Ecommerce',description:'Commerce header, category navigation and product focus.',density:'Comfortable',layout:'commerce'},
  {id:'community',name:'Community',description:'Portal layout for local news, jobs, services and events.',density:'Comfortable',layout:'portal'},
  {id:'minimal',name:'Minimal',description:'Simple typography, flat cards and maximum whitespace.',density:'Spacious',layout:'minimal'},
  {id:'real-estate',name:'Real Estate',description:'Large property imagery with search-led presentation.',density:'Spacious',layout:'property'},
  {id:'automotive',name:'Automotive',description:'Bold vehicle gallery and specification-focused cards.',density:'Comfortable',layout:'auto'},
  {id:'luxury',name:'Luxury',description:'Premium editorial spacing and elegant presentation.',density:'Spacious',layout:'luxury'},
];

const themes: ThemeOption[] = [
  {id:'light',name:'Light',description:'Clean white marketplace',colors:['#ffffff','#f1f5f9','#2563eb','#0f172a']},
  {id:'dark',name:'Dark',description:'Dark surfaces and bright accents',colors:['#0f172a','#1e293b','#38bdf8','#f8fafc'],dark:true},
  {id:'teal',name:'Teal',description:'Vunoca default',colors:['#f0fdfa','#ccfbf1','#0f766e','#134e4a']},
  {id:'blue',name:'Blue',description:'Trustworthy and corporate',colors:['#eff6ff','#dbeafe','#2563eb','#1e3a8a']},
  {id:'green',name:'Green',description:'Fresh local marketplace',colors:['#f0fdf4','#dcfce7','#16a34a','#14532d']},
  {id:'orange',name:'Orange',description:'Warm and energetic',colors:['#fff7ed','#ffedd5','#ea580c','#7c2d12']},
  {id:'purple',name:'Purple',description:'Community and creative',colors:['#faf5ff','#f3e8ff','#9333ea','#581c87']},
  {id:'gold',name:'Gold',description:'Premium and luxury',colors:['#fffbeb','#fef3c7','#b45309','#451a03']},
];

const groups: Array<{title:string; description:string; fields:Field[]}> = [
  { title:'Style & Theme', description:'Choose the overall customer layout, color theme and visual density.', fields:[
    {key:'layout.style',label:'Page Style',control:'style',span2:true},
    {key:'layout.theme',label:'Color Theme',control:'theme',span2:true},
    {key:'layout.density',label:'Layout Density',control:'select',options:['compact','comfortable','spacious']},
    {key:'layout.font',label:'Font Family',control:'select',options:['Inter','Roboto','Open Sans','Poppins','Nunito','Georgia']},
    {key:'layout.radius',label:'Border Radius (px)',type:'number'},
    {key:'layout.card_style',label:'General Card Style',control:'select',options:['shadow','border','flat','glass']},
  ]},
  { title:'Page Components', description:'Control the customer header, hero, categories, listing cards and footer.', fields:[
    {key:'layout.header_style',label:'Header Style',control:'select',options:['classic','centered','commerce','transparent']},
    {key:'layout.hero_style',label:'Hero Style',control:'select',options:['banner','search','gradient','minimal']},
    {key:'layout.category_style',label:'Category Style',control:'select',options:['grid','carousel','pills','sidebar']},
    {key:'layout.listing_card_style',label:'Listing Card Style',control:'select',options:['modern','compact','classic','gallery','horizontal','luxury']},
    {key:'layout.footer_columns',label:'Footer Columns',control:'select',options:['1','2','3','4']},
  ]},
  { title:'Homepage Sections', description:'Show or hide homepage areas without changing customer code.', fields:[
    {key:'layout.show_hero',label:'Show Hero / Advertisements',control:'checkbox'},
    {key:'layout.show_categories',label:'Show Categories & Filters',control:'checkbox'},
    {key:'layout.show_featured',label:'Show Featured Listings',control:'checkbox'},
    {key:'layout.show_newest',label:'Show Newest Listings',control:'checkbox'},
    {key:'layout.show_nearby',label:'Use Nearby Listings',control:'checkbox'},
    {key:'layout.show_sponsored',label:'Show Sponsored Feed Banner',control:'checkbox'},
    {key:'layout.show_right_rail',label:'Show Right Rail',control:'checkbox'},
  ]},
  { title:'Branding', description:'Customer website identity, colors and page background.', fields:[
    {key:'site.name',label:'Website Name',placeholder:'Vunoca'},
    {key:'site.logo_url',label:'Homepage Logo',upload:true},
    {key:'site.favicon_url',label:'Browser / Taskbar Logo',upload:true},
    {key:'site.primary_color',label:'Primary Color',type:'color'},
    {key:'site.secondary_color',label:'Secondary Color',type:'color'},
    {key:'site.background_color',label:'Page Background Color',type:'color'},
    {key:'site.background_image_url',label:'Page Background Image',upload:true,span2:true},
    {key:'site.background_size',label:'Background Size',control:'select',options:['cover','contain','auto']},
    {key:'site.background_position',label:'Background Position',control:'select',options:['center top','center center','left top','right top']},
    {key:'site.background_repeat',label:'Background Repeat',control:'select',options:['no-repeat','repeat','repeat-x','repeat-y']},
  ]},
  { title:'Localization', description:'Default customer language and language selector visibility.', fields:[
    {key:'localization.default_language',label:'Default Language',control:'select',options:['en','vi','es','ja','zh']},
    {key:'localization.show_language_selector',label:'Show Language Selector to Customers',control:'checkbox'},
  ]},
  { title:'SEO', description:'Default browser and search-engine metadata.', fields:[
    {key:'seo.title',label:'SEO Title',placeholder:'Vunoca - Local Classifieds'},
    {key:'seo.description',label:'SEO Description',control:'textarea',span2:true,placeholder:'Buy, sell and discover local listings near you.'},
  ]},
  { title:'Social Links', description:'Links displayed in the customer header or footer.', fields:[
    {key:'social.facebook_url',label:'Facebook Link'}, {key:'social.youtube_url',label:'YouTube Link'}, {key:'social.instagram_url',label:'Instagram Link'},
  ]},
  { title:'Contact & Footer', description:'Public contact information and footer content.', fields:[
    {key:'contact.email',label:'Contact Email'}, {key:'contact.phone',label:'Contact Phone'}, {key:'contact.address',label:'Address'},
    {key:'footer.text',label:'Footer Text',control:'textarea',span2:true},
  ]},
];

function resolveUrl(url:string){ if(!url) return ''; if(/^https?:\/\//i.test(url)||url.startsWith('data:')) return url; const root=appConfig.apiBaseUrl.replace(/\/api\/v1\/?$/i,''); return `${root}${url.startsWith('/')?url:`/${url}`}`; }
function isTrue(value:string|undefined){ return String(value||'').toLowerCase()==='true'; }


function StyleThumbnail({style,selected,published,onClick}:{style:StyleOption;selected:boolean;published?:boolean;onClick:()=>void}){
  return <button type="button" className={`style-thumbnail ${selected?'selected':''}`} onClick={onClick} aria-pressed={selected}>
    <div className={`style-mini style-mini-${style.layout}`}>
      <div className="style-mini-header"><i/><span/><b/></div>
      <div className="style-mini-hero"><strong/><em/></div>
      <div className="style-mini-body"><div/><div/><div/><div/></div>
    </div>
    <span className="style-thumbnail-copy"><strong>{style.name}</strong><small>{style.description}</small><em>{style.density}</em></span>
    <span className="style-thumbnail-badges">{style.id==='modern'&&<i>Default</i>}{published&&<b>Published</b>}{selected&&!published&&<b>Previewing</b>}</span>
  </button>;
}

function ThemeThumbnail({theme,selected,onClick}:{theme:ThemeOption;selected:boolean;onClick:()=>void}){
  return <div className={`theme-thumbnail ${selected?'selected':''}`} onClick={onClick} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}} role="button" tabIndex={0} aria-pressed={selected}>
    <div className="theme-mini-browser" style={{background:theme.colors[0],color:theme.colors[3]}}>
      <div className="theme-mini-header" style={{background:theme.dark?theme.colors[1]:'#fff'}}><span style={{background:theme.colors[2]}}/><i/><i/></div>
      <div className="theme-mini-hero" style={{background:`linear-gradient(135deg, ${theme.colors[1]}, ${theme.colors[0]})`}}><b style={{background:theme.colors[3]}}/><em style={{background:theme.colors[2]}}/></div>
      <div className="theme-mini-grid">{[0,1,2].map(i=><div key={i} style={{background:theme.dark?theme.colors[1]:'#fff',borderColor:theme.colors[1]}}><span style={{background:theme.colors[1]}}/><b style={{background:theme.colors[3]}}/><i style={{background:theme.colors[2]}}/></div>)}</div>
    </div>
    <div className="theme-thumbnail-meta"><strong>{theme.name}</strong><small>{theme.description}</small><span className="theme-swatches">{theme.colors.map(c=><i key={c} style={{background:c}}/>)}</span></div>
  </div>;
}

export function CustomerLayoutSettingsPage(){
  const settingsApi=useApi<any>(['/admin/site-settings','/site-settings'],{settings:{}});
  const initial=useMemo<Form>(()=>({...(((settingsApi.data as any)?.settings ?? (settingsApi.data as any)?.branding) ?? {})}),[settingsApi.data]);
  const [form,setForm]=useState<Form>({});
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [themeOpen,setThemeOpen]=useState(false);
  const values={...initial,...form};
  const dirty=Object.keys(form).length>0;
  const setValue=(key:string,value:string)=>{setSaved(false);setForm(prev=>({...prev,[key]:value}));};
  async function upload(key:string,file?:File|null){ if(!file)return; try{const result:any=await apiClient.uploadMedia(file); const url=result?.url||result?.data?.url||result?.asset?.url||''; if(!url)throw new Error('Upload did not return image URL.'); setValue(key,url);}catch(e){alert((e as Error).message)} }
  async function save(){
    setSaving(true);setSaved(false);
    try{
      await apiClient.post('/admin/site-settings',{settings:values});
      await settingsApi.load();
      setForm({});setSaved(true);
      window.setTimeout(()=>setSaved(false),3000);
    }catch(e){alert((e as Error).message)}finally{setSaving(false)}
  }
  const publishedStyleId=initial['layout.style']||'modern';
  const publishedThemeId=initial['layout.theme']||'teal';
  const selectedStyle=styles.find(x=>x.id===(values['layout.style']||'modern'))||styles[0];
  const publishedStyle=styles.find(x=>x.id===publishedStyleId)||styles[0];
  const selectedTheme=themes.find(x=>x.id===(values['layout.theme']||'teal'))||themes[2];
  const publishedTheme=themes.find(x=>x.id===publishedThemeId)||themes[2];
  const density=values['layout.density']||'comfortable';
  const cardStyle=values['layout.card_style']||'shadow';
  const radius=Number(values['layout.radius']||12);
  return <>
    <PageHero eyebrow="CUSTOMER LAYOUT" title="Customer Layout" description="Manage style, theme, branding, homepage sections and public website content." actions={<div className="layout-save-actions">{saved&&<span className="save-success">Saved successfully</span>}<AdminButton variant="primary" onClick={save} disabled={saving||!dirty}>{saving?'Saving...':dirty?'Save Layout':'Saved'}</AdminButton></div>} />

    <section className="layout-current-bar">
      <div><span>Currently published</span><strong>{publishedStyle.name} style · {publishedTheme.name} theme</strong><small>{!initial['layout.style']&&!initial['layout.theme']?'System default is Modern + Teal.':'These are the settings currently used by Customer.'}</small></div>
      <div className="layout-current-chips"><span>Style: <b>{publishedStyle.name}</b>{publishedStyle.id==='modern'&&<i>Default</i>}</span><span>Theme: <b>{publishedTheme.name}</b>{publishedTheme.id==='teal'&&<i>Default</i>}</span></div>
    </section>

    <section className="admin-card layout-visual-selector">
      <div className="section-header-row"><div><h2>Choose Page Style</h2><p>Click a layout image. The live preview below updates immediately before saving.</p></div><span className="preview-style-badge">Previewing: {selectedStyle.name} · {selectedTheme.name}</span></div>
      <div className="style-thumbnail-grid">{styles.map(style=><StyleThumbnail key={style.id} style={style} selected={selectedStyle.id===style.id} published={publishedStyle.id===style.id} onClick={()=>setValue('layout.style',style.id)}/>)}</div>
      <div className="theme-inline-heading"><div><h3>Choose Color Theme</h3><p>Current selection and published theme are labeled below.</p></div><AdminButton onClick={()=>setThemeOpen(true)}>View larger theme images</AdminButton></div>
      <div className="theme-inline-grid">{themes.map(theme=><ThemeThumbnail key={theme.id} theme={theme} selected={selectedTheme.id===theme.id} onClick={()=>setValue('layout.theme',theme.id)}/>)}</div>
    </section>

    <section className="admin-card customer-layout-preview-card">
      <div className="section-header-row"><div><h2><span className="live-dot"/> Live Customer Preview</h2><p>This preview changes immediately when you select style, theme, density, cards, header or sections.</p></div><div className="preview-status-stack"><span className="preview-style-badge">{selectedStyle.name} · {selectedTheme.name}</span>{dirty?<small>Unsaved preview</small>:<small>Matches published site</small>}</div></div>
      <div className={`customer-layout-preview style-${selectedStyle.id} density-${density} card-${cardStyle}`} style={{
        ['--preview-primary' as any]:values['site.primary_color']||selectedTheme.colors[2],
        ['--preview-secondary' as any]:values['site.secondary_color']||selectedTheme.colors[1],
        ['--preview-bg' as any]:values['site.background_color']||selectedTheme.colors[0],
        ['--preview-text' as any]:selectedTheme.colors[3],
        ['--preview-radius' as any]:`${Math.max(0,Math.min(radius,32))}px`,
        fontFamily:values['layout.font']||'Inter',
        backgroundImage:values['site.background_image_url']?`url(${resolveUrl(values['site.background_image_url'])})`:'none',
        backgroundSize:values['site.background_size']||'cover',backgroundPosition:values['site.background_position']||'center top',backgroundRepeat:values['site.background_repeat']||'no-repeat'
      }}>
        <div className={`preview-header header-${values['layout.header_style']||'classic'}`}>
          <div className="preview-brand">{values['site.logo_url']?<img src={resolveUrl(values['site.logo_url'])} alt="Logo preview"/>:<span>VO</span>}<strong>{values['site.name']||'Vunoca'}</strong></div><div className="preview-search">Search listings...</div><button>Post Listing</button>
        </div>
        {isTrue(values['layout.show_hero']??'true')&&<div className={`preview-hero hero-${values['layout.hero_style']||'banner'}`}><div><h3>Find what you need nearby</h3><p>{values['seo.description']||'Buy, sell and discover local listings near you.'}</p><div className="preview-hero-search">What are you looking for?</div></div></div>}
        {isTrue(values['layout.show_categories']??'true')&&<div className={`preview-categories categories-${values['layout.category_style']||'grid'}`}>{['Cars','Homes','Jobs','Services','Electronics'].map(x=><span key={x}>{x}</span>)}</div>}
        <div className="preview-content-grid"><main><div className="preview-section-title"><strong>{isTrue(values['layout.show_featured']??'true')?'Featured Listings':'Newest Listings'}</strong><small>View all</small></div><div className={`preview-listings listing-${values['layout.listing_card_style']||'modern'}`}>{[1,2,3,4].map(i=><article key={i}><div className="preview-image"/><div><b>{['2BR Apartment','Toyota Camry','Dining Table','Local Service'][i-1]}</b><small>Santa Clara, CA</small><strong>${[2200,14500,180,75][i-1].toLocaleString()}</strong></div></article>)}</div></main>{isTrue(values['layout.show_right_rail']??'true')&&<aside><strong>Nearby</strong><div/><div/><div/></aside>}</div>
        <div className={`preview-footer columns-${values['layout.footer_columns']||'4'}`}>{Array.from({length:Number(values['layout.footer_columns']||4)},(_,i)=><div key={i}><b>{['About','Explore','Support','Follow'][i]||'Links'}</b><span/><span/><span/></div>)}</div>
      </div>
    </section>

    {groups.map(group=><section className="admin-card site-settings-card" key={group.title}><div className="section-header-row site-settings-section-header"><div><h2>{group.title}</h2><p>{group.description}</p></div><AdminToolbar><AdminButton onClick={settingsApi.load}>Refresh</AdminButton></AdminToolbar></div><div className="settings-group-box"><div className="ad-form-grid site-settings-grid">{group.fields.map(field=><div className={`${field.upload?'site-setting-upload ':''}${field.span2?'span2':''}`.trim()} key={field.key}>{field.control==='style'?<div className="selected-layout-summary"><label>{field.label}</label><strong>{selectedStyle.name}</strong><span>{selectedStyle.description}</span><button type="button" onClick={()=>document.querySelector('.layout-visual-selector')?.scrollIntoView({behavior:'smooth'})}>Change using layout images above</button></div>:field.control==='theme'?<div className="selected-layout-summary"><label>{field.label}</label><strong>{selectedTheme.name}</strong><span>{selectedTheme.description}</span><button type="button" onClick={()=>setThemeOpen(true)}>Open theme images</button></div>:field.control==='checkbox'?<AdminCheckbox className="site-setting-checkbox" label={field.label} checked={isTrue(values[field.key])} onChange={e=>setValue(field.key,String(e.target.checked))}/>:field.control==='textarea'?<AdminTextArea label={field.label} value={values[field.key]||''} placeholder={field.placeholder} rows={5} onChange={e=>setValue(field.key,e.target.value)}/>:field.control==='select'?<AdminSelect label={field.label} value={values[field.key]||field.options?.[0]||''} options={field.options} onChange={e=>setValue(field.key,e.target.value)}/>:<AdminTextBox label={field.label} type={field.type||'text'} value={values[field.key]||''} placeholder={field.placeholder} onChange={e=>setValue(field.key,e.target.value)}/>} {field.upload&&<div className="upload-line"><input type="file" accept="image/*" onChange={e=>upload(field.key,e.target.files?.[0])}/>{values[field.key]&&<img src={resolveUrl(values[field.key])} alt={`${field.label} preview`}/>}</div>}</div>)}</div></div></section>)}

    {themeOpen&&<div className="theme-modal-backdrop" role="presentation" onMouseDown={()=>setThemeOpen(false)}><div className="theme-modal" role="dialog" aria-modal="true" aria-label="Choose customer theme" onMouseDown={e=>e.stopPropagation()}><div className="theme-modal-header"><div><h2>Choose Theme</h2><p>Select a visual theme. You can still customize colors below.</p></div><button type="button" onClick={()=>setThemeOpen(false)}>×</button></div><div className="theme-modal-grid">{themes.map(theme=><div className="theme-modal-option" key={theme.id}><ThemeThumbnail theme={theme} selected={selectedTheme.id===theme.id} onClick={()=>{setValue('layout.theme',theme.id);setThemeOpen(false)}}/><div className="theme-option-labels">{theme.id==='teal'&&<span>System default</span>}{theme.id===publishedTheme.id&&<b>Currently published</b>}{theme.id===selectedTheme.id&&<i>Selected preview</i>}</div></div>)}</div></div></div>}
  </>;
}
