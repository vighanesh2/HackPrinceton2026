# n8n Workflow Design - X Posting Agent

## Overview
**ONE reusable workflow** that handles posting for ALL users. Receives `user_id` via webhook and processes the entire posting flow.

## Workflow Structure

### Trigger Node: Webhook
- **Type**: Webhook
- **Method**: POST
- **Path**: `/x-post-agent` (or your custom path)
- **Response Mode**: Respond to Webhook
- **Expected Payload**:
  ```json
  {
    "user_id": "uuid-here",
    "test_mode": false  // optional
  }
  ```

### Node 1: Fetch User Data from Supabase
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_user_for_posting`
- **Headers**:
  ```
  apikey: YOUR_SUPABASE_ANON_KEY
  Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Query Parameters**:
  ```
  p_user_id: {{ $json.body.user_id }}
  ```
- **Error Handling**: If user not found or tokens expired, end workflow with error

### Node 2: Decrypt Access Token
- **Type**: Code (JavaScript)
- **Purpose**: Decrypt the encrypted access token
- **Code**:
  ```javascript
  // In production, use Supabase Vault or proper decryption
  // For MVP, if using base64: Buffer.from(encrypted, 'base64').toString()
  
  const encrypted = $input.item.json.access_token_encrypted;
  // TODO: Implement proper decryption based on your encryption method
  const accessToken = encrypted; // Replace with actual decryption
  
  return {
    json: {
      ...$input.item.json,
      access_token: accessToken
    }
  };
  ```

### Node 3: Generate Post with LLM
- **Type**: OpenAI / Anthropic / Google AI
- **Model**: GPT-4, Claude, or Gemini
- **System Prompt**: (See `ai-system-prompt.md`)
- **User Prompt Template**:
  ```
  Generate a daily X post for:
  Company: {{ $json.company_name }}
  Industry: {{ $json.industry }}
  Description: {{ $json.description }}
  
  Today's context: [Optional - add current events, trends]
  ```
- **Temperature**: 0.7
- **Max Tokens**: 100 (to stay under 280 chars)
- **Output**: Plain text post (no JSON, no markdown)

### Node 4: Validate Post Length
- **Type**: Code (JavaScript)
- **Purpose**: Ensure post is ≤ 280 characters
- **Code**:
  ```javascript
  const post = $input.item.json.post_text || $input.item.json.content;
  
  if (post.length > 280) {
    // Truncate or regenerate
    throw new Error(`Post too long: ${post.length} characters`);
  }
  
  return {
    json: {
      ...$input.item.json,
      post_text: post.trim(),
      post_length: post.length
    }
  };
  ```

### Node 5: Post to X API
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://api.twitter.com/2/tweets`
- **Headers**:
  ```
  Authorization: Bearer {{ $json.access_token }}
  Content-Type: application/json
  ```
- **Body**:
  ```json
  {
    "text": "{{ $json.post_text }}"
  }
  ```
- **Error Handling**: 
  - 401: Token expired → Refresh token (if refresh_token available)
  - 403: Rate limit → Log and skip
  - Other: Log error and continue

### Node 6: Save to Post History
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://YOUR_PROJECT.supabase.co/rest/v1/post_history`
- **Headers**:
  ```
  apikey: YOUR_SUPABASE_ANON_KEY
  Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Body**:
  ```json
  {
    "user_id": "{{ $json.user_id }}",
    "post_text": "{{ $json.post_text }}",
    "x_post_id": "{{ $json.data.id }}",
    "status": "success",
    "posted_at": "{{ $now }}"
  }
  ```

### Node 7: Update Schedule (Success)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://YOUR_PROJECT.supabase.co/rest/v1/rpc/update_next_post_time`
- **Headers**: Same as Node 6
- **Query Parameters**:
  ```
  p_user_id: {{ $json.user_id }}
  ```

### Error Handling Branch
- **Type**: IF Node
- **Condition**: Check if any previous node failed
- **On Error**: 
  - Save failed post to `post_history` with `status: 'failed'`
  - Log error message
  - Send notification (optional)

## Workflow Variables (n8n Settings)
Set these in n8n workflow settings:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for bypassing RLS)
- `OPENAI_API_KEY`: Or your LLM provider key
- `X_API_BASE`: `https://api.twitter.com/2`

## Error Handling Strategy
1. **User not found**: End workflow, log error
2. **Token expired**: Attempt refresh, if fails → end workflow
3. **LLM failure**: Retry once, then end with error
4. **X API failure**: Save as failed post, don't update schedule
5. **Supabase write failure**: Log error, but don't fail entire workflow

## Testing
1. Use `test_mode: true` in webhook payload
2. In test mode, skip actual X posting, but log what would be posted
3. Verify all database writes succeed

## Rate Limiting
- X API: 300 tweets per 3 hours (per user)
- n8n: Handle rate limits gracefully
- If rate limited, schedule retry for next hour

## Security Notes
- Never log access tokens
- Use service role key only in n8n (never expose to frontend)
- Encrypt tokens at rest in database
- Validate user_id in webhook payload

