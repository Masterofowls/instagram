import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req) {
  // Get the headers
  const headersList = headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response('Error: Missing Clerk webhook secret', {
      status: 500,
    });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Webhook with type ${eventType} received`);

  if (eventType === 'user.created') {
    // A new user has been created in Clerk
    const { id, first_name, last_name, username, image_url, email_addresses } = evt.data;
    
    const email = email_addresses && email_addresses.length > 0 
      ? email_addresses[0].email_address 
      : null;
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: id, // Use Clerk's ID as the Supabase ID
        clerk_id: id,
        full_name: `${first_name || ''} ${last_name || ''}`.trim(),
        username: username || `user_${id.substring(0, 8)}`,
        email: email,
        avatar_url: image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error creating user in Supabase:', error);
      return new Response('Error creating user in Supabase', { status: 500 });
    }
    
  } else if (eventType === 'user.updated') {
    // A user has been updated in Clerk
    const { id, first_name, last_name, username, image_url, email_addresses } = evt.data;
    
    const email = email_addresses && email_addresses.length > 0 
      ? email_addresses[0].email_address 
      : null;
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: `${first_name || ''} ${last_name || ''}`.trim(),
        username: username || `user_${id.substring(0, 8)}`,
        email: email,
        avatar_url: image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id);
    
    if (error) {
      console.error('Error updating user in Supabase:', error);
      return new Response('Error updating user in Supabase', { status: 500 });
    }
    
  } else if (eventType === 'user.deleted') {
    // A user has been deleted in Clerk
    const { id } = evt.data;
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id);
    
    if (error) {
      console.error('Error soft-deleting user in Supabase:', error);
      return new Response('Error soft-deleting user in Supabase', { status: 500 });
    }
  }

  return new Response('Webhook received and processed', { status: 200 });
}
