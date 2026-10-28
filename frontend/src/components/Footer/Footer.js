import React from "react";
import { Box, Container, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2.5,
                px: 2,
                mt: "auto",
                background: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(13, 125, 112, 0.12)",
                boxShadow: "0px -2px 14px rgba(15, 23, 42, 0.03)",
                textAlign: "center",
            }}
        >
            <Container maxWidth="md">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1.5,
                        fontSize: "0.85rem",
                        color: "#475569",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.85rem" }}>
                            This app is from{" "}
                            <Typography
                                component="span"
                                sx={{
                                    color: "#0D7D70",
                                    fontWeight: 700,
                                }}
                            >
                                Creoversity
                            </Typography>
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: "center",
                            gap: { xs: 0.5, sm: 2 },
                        }}
                    >
                        <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.825rem" }}>
                            <strong style={{ color: "#0F172A" }}>Developer:</strong> Raman
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
