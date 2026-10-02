import type { Metadata } from 'next';
import './globals.css';
import {siteUrl,siteIndexable} from './site-config';
import { Header, Footer } from './ui';
export const metadata: Metadata={metadataBase:new URL(siteUrl),title:{default:'Swift West Cleaners | Professional Cleaning Western Melbourne',template:'%s | Swift West Cleaners'},description:'Professional commercial, domestic, NDIS, end of lease and carpet cleaning across Western Melbourne. Request a free quote tailored to your space.',robots:{index:siteIndexable,follow:siteIndexable},icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en-AU"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness",name:"Swift West Cleaners",url:siteUrl,areaServed:{"@type":"Place",name:"Western Melbourne, Victoria, Australia"},description:"Commercial, domestic, NDIS, end-of-lease and carpet cleaning across Western Melbourne."})}}/><a className="skip" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/></body></html>}
