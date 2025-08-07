"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { pdf } from '@react-pdf/renderer';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// Simple test component similar to playground
const SimpleTestDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Simple Test PDF</Text>
        <Text style={styles.text}>This is a test PDF generated with react-pdf</Text>
        <Text style={styles.text}>Date: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
  },
});

export default function SimpleTestPage() {
  const { toast } = useToast();

  const handleSimpleTest = async () => {
    try {
      // Generate simple PDF
      const pdfBlob = await pdf(<SimpleTestDocument />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `simple-test-${Date.now()}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Simple PDF generated successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error("Simple PDF test error:", error);
      toast({
        title: "Error",
        description: `Failed to generate simple PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Simple PDF Test</h1>
        <p className="text-gray-600 mb-6">
          This tests basic react-pdf functionality without your PrescriptionPDF component.
        </p>
        <Button onClick={handleSimpleTest} className="w-full">
          Generate Simple PDF
        </Button>
      </div>
    </div>
  );
} 