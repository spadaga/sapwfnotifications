import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// --- START ENVIRONMENT CONFIGURATION ---
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '..', 'env', `.env.${nodeEnv}`);

if (existsSync(envPath)) {
  console.log('✅ Loading environment variables from:', envPath);
  config({ path: envPath });
} else {
  console.error(`❌ Environment file not found at: ${envPath}`);
}
// --- END ENVIRONMENT CONFIGURATION ---

async function startServer() {
  const express = (await import('express')).default;
  const axios = (await import('axios')).default;
  const { createIndividualApprovalCard, approveWorkflow, rejectWorkflow } = await import('../utils/workflow.js');
  const { isProduction, teamsWebhookUrl, port, inboxUrl } = await import('../src/config.js');

  const app = express();
  app.use(express.json());

  const publicPath = join(__dirname, '..', '..', 'public');
  console.log(`Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));

  // --- API Endpoints ---
  app.post('/api/trigger-workflow', async (req, res) => {
    try {
      if (!teamsWebhookUrl) {
        console.warn("TEAMS_WEBHOOK_URL is not configured. Displaying card JSON instead of sending to Teams.");
        return res.status(500).json({ 
          message: "[DEVELOPMENT MODE - NO WEBHOOK]\n\nTeams Webhook URL is not configured."
        });
      }
      
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
      // The new "Workflows" webhook expects the raw Adaptive Card JSON directly.
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
  });

  app.post('/api/process-action', async (req, res) => {
    const { action, instanceId } = req.body;
    try {
      let result;
      if (action === 'approve') {
        result = await approveWorkflow(instanceId);
      } else if (action === 'reject') {
        result = await rejectWorkflow(instanceId);
      } else {
        return res.status(400).json({ message: 'Invalid action specified.' });
      }
      res.json(result);
    } catch (error) {
      console.error(`Error processing action '${action}' for instance ${instanceId}:`, error);
      res.status(500).json({ message: `Failed to process action: ${error.message}` });
    }
  });

  app.get('*', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });

  app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
}

startServer();