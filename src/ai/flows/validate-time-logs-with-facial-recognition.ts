'use server';
/**
 * @fileOverview Validates time logs by comparing submitted photos with profile photos using facial recognition.
 *
 * - validateTimeLogsWithFacialRecognition - A function that validates time logs using facial recognition.
 * - ValidateTimeLogsWithFacialRecognitionInput - The input type for the validateTimeLogsWithFacialRecognition function.
 * - ValidateTimeLogsWithFacialRecognitionOutput - The return type for the validateTimeLogsWithFacialRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateTimeLogsWithFacialRecognitionInputSchema = z.object({
  profilePhotoDataUri: z
    .string()
    .describe(
      "The user's profile photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  submittedPhotoDataUri: z
    .string()
    .describe(
      'The submitted photo at the clock-in/clock-out time, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type ValidateTimeLogsWithFacialRecognitionInput = z.infer<
  typeof ValidateTimeLogsWithFacialRecognitionInputSchema
>;

const ValidateTimeLogsWithFacialRecognitionOutputSchema = z.object({
  isValidated: z
    .boolean()
    .describe('Whether the submitted photo matches the profile photo.'),
  confidence: z
    .number()
    .describe(
      'The confidence level of the facial recognition match, between 0 and 1.'
    ),
  reason: z
    .string()
    .describe('The reason for the validation result.'),
});
export type ValidateTimeLogsWithFacialRecognitionOutput = z.infer<
  typeof ValidateTimeLogsWithFacialRecognitionOutputSchema
>;

export async function validateTimeLogsWithFacialRecognition(
  input: ValidateTimeLogsWithFacialRecognitionInput
): Promise<ValidateTimeLogsWithFacialRecognitionOutput> {
  return validateTimeLogsWithFacialRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateTimeLogsWithFacialRecognitionPrompt',
  input: {schema: ValidateTimeLogsWithFacialRecognitionInputSchema},
  output: {schema: ValidateTimeLogsWithFacialRecognitionOutputSchema},
  prompt: `You are an AI facial recognition expert. Compare the submitted photo with the profile photo and determine if they are the same person.

Profile Photo: {{media url=profilePhotoDataUri}}
Submitted Photo: {{media url=submittedPhotoDataUri}}

Respond in JSON format with the following fields:
- isValidated (boolean): Whether the submitted photo matches the profile photo.
- confidence (number): The confidence level of the facial recognition match, between 0 and 1.
- reason (string): The reason for the validation result.
`,
});

const validateTimeLogsWithFacialRecognitionFlow = ai.defineFlow(
  {
    name: 'validateTimeLogsWithFacialRecognitionFlow',
    inputSchema: ValidateTimeLogsWithFacialRecognitionInputSchema,
    outputSchema: ValidateTimeLogsWithFacialRecognitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

