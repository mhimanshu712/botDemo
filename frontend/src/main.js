import App from './App.svelte';
import './app.css';

const app = new App({
    target: document.getElementById('app'),
    props: {
        url: ''
    }
});

export default app; 