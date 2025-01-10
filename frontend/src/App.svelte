<script>
  import { Router, Link, Route } from "svelte-routing";
  import Chat from "./routes/Chat.svelte";
  import Models from "./routes/Models.svelte";
  import Users from "./routes/Users.svelte";

  export let url = "";
</script>

<Router {url}>
  <nav class="navbar">
    <div class="container">
      <Link to="/" class="brand">Ads Local Chat</Link>
      <div class="nav-links">
        <Link to="/">Chat</Link>
        <Link to="/models">Models</Link>
        <Link to="/users">Users</Link>
      </div>
    </div>
  </nav>

  <main>
    <Route path="/" component={Chat} />
    <Route path="/models" component={Models} />
    <Route path="/users" component={Users} />
  </main>
</Router>

<style>
  .navbar {
    background: #8b5cf6;
    padding: 1rem;
    color: white;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1rem;
  }

  .nav-links :global(a) {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .nav-links :global(a:hover) {
    background-color: rgba(255, 255, 255, 0.1);
  }

  main {
    padding: 1rem;
  }
</style>
