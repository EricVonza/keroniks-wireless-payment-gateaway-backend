const handlePayheroCallback = async (req, res) => {
    try {
        console.log('PayHero callback received:', JSON.stringify(req.body, null, 2));

        // TODO: find the payment by its reference, update its status
        // (success/failed), and activate the customer's internet package.

        // Respond quickly with 200 so PayHero doesn't keep retrying
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false });
    }
};

module.exports = { handlePayheroCallback };