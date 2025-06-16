import axios from 'axios';
import { createIndividualApprovalCard } from '../src/utils/workflow.js';
import { isProduction, teamsWebhookUrl, inboxUrl } from '../src/utils/config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    if (!teamsWebhookUrl) {
      console.warn("TEAMS_WEBHOOK_URL is not configured.");
      return res.status(500).json({ 
        message: "[CONFIG ERROR] Teams Webhook URL is not configured."
      });
    }
    
    // In a real scenario, this would come from the SAP webhook (req.body)
    // For now, we continue to use mock data to trigger the flow.
    const mockSapData = {
      TaskTitle: "Verify General Journal Entry 100000144 GMM1 2025",
      Status: "READY",
      InstanceID: "000000057230",
      TaskDetails: "#$# Document Type : G/L Account Document #$# Company Code : GM Manufacturing #$# Amount : 1.100,00 USD",
      CreatedByName: "Ayush Agrawal",
      CreatedOn: "2025-05-26T10:00:00Z",
      InboxURL: inboxUrl || '#inbox'
    };

    const adaptiveCardJson = createIndividualApprovalCard(mockSapData, isProduction);

    console.log(`Sending notification to Teams webhook...`);
    await axios.post(teamsWebhookUrl, adaptiveCardJson);
    
    res.status(200).json({ message: 'Success! The notification has been sent to the configured Teams channel.' });

  } catch (error) {
    console.error('--- ERROR IN /api/trigger-workflow ---');
    console.error('Error Message:', error.message);
    const errorMessage = error.response ? `Status ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}` : error.message;
    res.status(500).json({ 
        message: 'An internal server error occurred while sending the notification to Teams.',
        error: errorMessage
    });
  }
}
