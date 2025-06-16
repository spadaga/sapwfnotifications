import { approveWorkflow, rejectWorkflow } from '../src/utils/workflow.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }
  
  const { action, instanceId } = req.body;
  
  console.log(`Received action: '${action}' for instance: '${instanceId}'`);

  try {
    let result;
    if (action === 'approve') {
      result = await approveWorkflow(instanceId);
    } else if (action === 'reject') {
      result = await rejectWorkflow(instanceId);
    } else {
      return res.status(400).json({ message: 'Invalid action specified.' });
    }
    
    // Teams expects a 200 OK response to confirm the action was received.
    res.status(200).json({ message: `Action '${action}' processed successfully.`, sap_response: result });

  } catch (error) {
    console.error(`Error processing action '${action}' for instance ${instanceId}:`, error);
    res.status(500).json({ message: `Failed to process action: ${error.message}` });
  }
}