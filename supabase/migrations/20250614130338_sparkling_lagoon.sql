-- Create function to refresh subscription data
CREATE OR REPLACE FUNCTION refresh_subscription_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  customer_record record;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Check if user exists
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get customer record for the user
  SELECT * INTO customer_record
  FROM stripe_customers
  WHERE user_id = auth.uid() AND deleted_at IS NULL;
  
  -- If no customer record found, return false
  IF customer_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Force refresh of subscription data from cache
  -- This is a no-op update that will trigger the webhook handler to refresh data
  UPDATE stripe_subscriptions
  SET updated_at = now()
  WHERE customer_id = customer_record.customer_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_subscription_data() TO authenticated;