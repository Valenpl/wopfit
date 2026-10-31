package com.wopfit.entity.dto;

/** Un consejo de expertos con su fuente. `text` puede traer **negrita**. */
public record ExpertTip(String text, String source, String url) {}
