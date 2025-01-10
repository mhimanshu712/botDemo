<script>
  import { onMount } from "svelte";

  let users = [];
  let loading = true;

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      users = await response.json();
    } catch (error) {
      console.error("Error:", error);
      alert("Error fetching users");
    } finally {
      loading = false;
    }
  }

  onMount(fetchUsers);
</script>

<div class="container">
  <h1>User List</h1>
  <button class="refresh-btn" on:click={fetchUsers}>Refresh</button>

  {#if loading}
    <div class="loading">Loading users...</div>
  {:else}
    <table class="user-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user}
          <tr>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.timestamp}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1 {
    color: #333;
    text-align: center;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    margin-top: 20px;
  }

  .user-table th,
  .user-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  .user-table th {
    background-color: #4caf50;
    color: white;
  }

  .user-table tr:hover {
    background-color: #f5f5f5;
  }

  .refresh-btn {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .refresh-btn:hover {
    background-color: #45a049;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }
</style>
