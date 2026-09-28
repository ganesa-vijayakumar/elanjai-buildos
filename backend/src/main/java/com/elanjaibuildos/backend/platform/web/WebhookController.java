package com.elanjaibuildos.backend.platform.web;

import com.elanjaibuildos.backend.platform.service.RazorpayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Razorpay webhook endpoint — signature-verified, idempotent. */
@RestController
@RequestMapping("/webhooks")
public class WebhookController {

    private final RazorpayService razorpay;

    public WebhookController(RazorpayService razorpay) {
        this.razorpay = razorpay;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<Void> razorpay(@RequestBody String body,
                                         @RequestHeader(value = "X-Razorpay-Signature", required = false) String sig) {
        if (sig == null || !razorpay.handleWebhook(body, sig)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
