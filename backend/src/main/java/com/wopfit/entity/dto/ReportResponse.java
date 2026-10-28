package com.wopfit.entity.dto;

import java.time.LocalDate;

public record ReportResponse(String action, ProposalResponse proposal, LocalDate movedTo, String message) {}
