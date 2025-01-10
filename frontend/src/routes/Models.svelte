<script>
  import { onMount } from "svelte";

  let models = [];
  let loading = true;

  async function fetchModels() {
    try {
      const response = await fetch("/api/models");
      models = await response.json();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      loading = false;
    }
  }

  async function handleModelClick(model) {
    try {
      const updateResponse = await fetch(
        `/api/updateInstruction/${model.number}`
      );
      if (updateResponse.ok) {
        window.location.href = `/chat?bot=${model.number}`;
      } else {
        alert("Failed to update model. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  onMount(fetchModels);
</script>

<h1>BizBot</h1>
<div class="model-list">
  {#if loading}
    <div class="loading">Loading models...</div>
  {:else}
    {#each models as model}
      <div class="model-card" on:click={() => handleModelClick(model)}>
        <img src={model.image} alt={model.name} class="model-image" />
        <div class="model-content">
          <div class="model-name">{model.name}</div>
          <div class="model-bio">{model.bio}</div>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  h1 {
    padding: 16px;
    background: #8b5cf6;
    color: #eef2ff;
    font-size: 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    margin: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    border-radius: 0;
    font-family: "Orbitron", sans-serif;
    letter-spacing: 1px;
    text-align: left;
  }

  .model-list {
    width: 100%;
    max-width: 100%;
    margin: 0;
    background: white;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .model-card {
    padding: 16px;
    border-bottom: 1px solid #e9edef;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .model-card:hover {
    background: #eef2ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .model-image {
    width: 49px;
    height: 49px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .model-content {
    flex: 1;
    min-width: 0;
  }

  .model-name {
    font-size: 17px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .model-bio {
    color: #4b5563;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.8;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #4b5563;
    opacity: 0.7;
  }

  @media (max-width: 767px) {
    .model-list {
      margin: 0;
    }
  }
</style>
