import '@shopify/ui-extensions/preact';
import { render } from 'preact';
function Extension(){
  return(<s-banner><s-text><s-link href="https://terrea.co.uk/pages/profile#edit-email" target="_top">Edit email</s-link></s-text></s-banner>);
}
export default async()=>{render(<Extension/>,document.body);};
