module.exports = (req, res) => {
    res.status(200).json({ status: 'Ok', message: 'Health check passed' });
};
